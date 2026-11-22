import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const payload = await req.json();
    const paymentId = payload?.data?.id;
    const eventId = String(payload?.id || `${paymentId}-${payload?.action}`);

    if (!paymentId || payload.type !== "payment") {
      return new Response("Ignored", { status: 200 });
    }

    // 1. Idempotência: ignora se este evento de webhook já foi processado
    const { data: existingLog } = await supabase
      .from("payment_webhooks_log")
      .select("id")
      .eq("mp_event_id", eventId)
      .maybeSingle();

    if (existingLog) return new Response("Already processed", { status: 200 });

    // 2. Consulta a API oficial do Mercado Pago (nunca confia apenas no corpo do webhook)
    const mpToken = Deno.env.get("MP_ACCESS_TOKEN")!;
   const mpRes = await fetch(
  "https://api.mercadopago.com/v1/payments/" + paymentId,
  {
    headers: {
      Authorization: "Bearer " + mpToken,
    },
  },
);
    const payment = await mpRes.json();

    const orderId = payment.external_reference;
    const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).single();

    if (!order) return new Response("Order not found", { status: 404 });

    // 3. Registra log do webhook
    await supabase.from("payment_webhooks_log").insert({
      mp_event_id: eventId,
      mp_payment_id: String(paymentId),
      action: payload.action || "payment.updated",
      payload: payment,
    });

    // 4. Conferência de valor, moeda e status oficial
    if (
      payment.status === "approved" &&
      payment.currency_id === "BRL" &&
      Number(payment.transaction_amount) >= Number(order.total_amount)
    ) {
      const fee = payment.fee_details?.reduce((acc: number, f: any) => acc + Number(f.amount), 0) || 0;
      const net = Number(payment.transaction_details?.net_received_amount || (order.total_amount - fee));

      await supabase.from("orders").update({
        status: "approved",
        mp_payment_id: String(paymentId),
        gateway_fee: fee,
        net_amount: net,
        updated_at: new Date().toISOString(),
      }).eq("id", orderId);

      // Libera os ingressos individuais para uso na portaria
      await supabase.from("tickets").update({ status: "approved" }).eq("order_id", orderId);
    } else if (payment.status === "cancelled" || payment.status === "rejected" || payment.status === "refunded") {
      const newStatus = payment.status === "refunded" ? "refunded" : "cancelled";
      await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
      await supabase.from("tickets").update({ status: newStatus }).eq("order_id", orderId);
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
const errorMessage = error instanceof Error
  ? error.message
  : String(error);

return new Response(errorMessage, { status: 500 });
  }
});