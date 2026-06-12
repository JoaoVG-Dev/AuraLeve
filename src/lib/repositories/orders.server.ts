import { getDb } from "@/lib/db/client.server";

export type OrderStatus = "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "expired";

export interface OrderRow {
  id: string;
  user_id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: "pix" | "credit" | "debit";
  payment_provider: string | null;
  payment_id: string | null;
  payment_expires_at: string | null;
  payment_status_detail: string | null;
  pix_qr_code: string | null;
  pix_copy_paste: string | null;
  paid_at: string | null;
  canceled_at: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address_cep: string;
  address_line: string;
  address_number: string;
  address_complement: string | null;
  address_city: string;
  address_state: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  coupon_code: string | null;
  created_at: string;
}

export interface OrderItemRow {
  id: string;
  product_id: string | null;
  product_name: string;
  product_image: string | null;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export interface OrderForPayment {
  id: string;
  user_id: string;
  total: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: "pix" | "credit" | "debit";
  payment_id: string | null;
  payment_expires_at: string | null;
  paid_at: string | null;
  canceled_at: string | null;
  customer_email: string;
  customer_name: string;
  customer_phone: string;
}

type NumericValue = string | number;
type OrderDbRow = Omit<OrderRow, "subtotal" | "discount" | "shipping" | "total"> & {
  subtotal: NumericValue;
  discount: NumericValue;
  shipping: NumericValue;
  total: NumericValue;
};
type OrderForPaymentDbRow = Omit<OrderForPayment, "total"> & { total: NumericValue };
type OrderItemDbRow = Omit<OrderItemRow, "unit_price" | "subtotal"> & {
  unit_price: NumericValue;
  subtotal: NumericValue;
};

const orderColumns = `
  id,
  user_id,
  status,
  payment_status,
  payment_method,
  payment_provider,
  payment_id,
  payment_expires_at,
  payment_status_detail,
  pix_qr_code,
  pix_copy_paste,
  paid_at,
  canceled_at,
  customer_name,
  customer_email,
  customer_phone,
  address_cep,
  address_line,
  address_number,
  address_complement,
  address_city,
  address_state,
  subtotal,
  discount,
  shipping,
  total,
  coupon_code,
  created_at
`;

function mapOrder(row: OrderDbRow): OrderRow {
  return {
    ...row,
    subtotal: Number(row.subtotal),
    discount: Number(row.discount),
    shipping: Number(row.shipping),
    total: Number(row.total),
  } as OrderRow;
}

function mapOrderForPayment(row: OrderForPaymentDbRow): OrderForPayment {
  return {
    ...row,
    total: Number(row.total),
  } as OrderForPayment;
}

function mapOrderItem(row: OrderItemDbRow): OrderItemRow {
  return {
    ...row,
    unit_price: Number(row.unit_price),
    subtotal: Number(row.subtotal),
  } as OrderItemRow;
}

export async function listOrdersForUser(userId: string) {
  const sql = getDb();
  const rows = await sql.query(
    `
      select ${orderColumns}
      from public.orders
      where user_id = $1::uuid
      order by created_at desc
    `,
    [userId],
  );

  return rows.map((row) => mapOrder(row as OrderDbRow));
}

export async function listAllOrders() {
  const sql = getDb();
  const rows = await sql.query(
    `
      select ${orderColumns}
      from public.orders
      order by created_at desc
    `,
  );

  return rows.map((row) => mapOrder(row as OrderDbRow));
}

export async function getOrderDetail(input: { orderId: string; userId: string; admin: boolean }) {
  const sql = getDb();
  const orderRows = await sql.query(
    `
      select ${orderColumns}
      from public.orders
      where id = $1::uuid
        and ($2::boolean or user_id = $3::uuid)
      limit 1
    `,
    [input.orderId, input.admin, input.userId],
  );
  const order = orderRows[0] ? mapOrder(orderRows[0] as OrderDbRow) : null;
  if (!order) return { order: null, items: [] as OrderItemRow[] };

  const itemRows = await sql`
    select id, product_id, product_name, product_image, unit_price, quantity, subtotal
    from public.order_items
    where order_id = ${input.orderId}::uuid
    order by created_at
  `;

  return {
    order,
    items: itemRows.map((row) => mapOrderItem(row as OrderItemDbRow)),
  };
}

export async function placeOrderForUser(input: {
  userId: string;
  items: Array<{ product_id: string; quantity: number }>;
  couponCode?: string | null;
  customer: Record<string, unknown>;
  paymentMethod: "pix" | "credit" | "debit";
}) {
  const sql = getDb();
  const rows = await sql.query(
    `
      select public.place_order_for_user(
        $1::uuid,
        $2::jsonb,
        $3::text,
        $4::jsonb,
        $5::text
      ) as order_id
    `,
    [
      input.userId,
      JSON.stringify(input.items),
      input.couponCode ?? "",
      JSON.stringify(input.customer),
      input.paymentMethod,
    ],
  );

  return String(rows[0]?.order_id ?? "");
}

export async function loadOrderForPayment(orderId: string, userId: string) {
  const sql = getDb();
  const rows = await sql`
    select
      id,
      user_id,
      total,
      status,
      payment_status,
      payment_method,
      payment_id,
      payment_expires_at,
      paid_at,
      canceled_at,
      customer_email,
      customer_name,
      customer_phone
    from public.orders
    where id = ${orderId}::uuid
    limit 1
  `;

  if (!rows[0]) throw new Error("Pedido nao encontrado");
  const order = mapOrderForPayment(rows[0] as OrderForPaymentDbRow);
  if (order.user_id !== userId) throw new Error("Pedido nao pertence ao usuario");
  return order;
}

export async function updatePixPaymentCreated(input: {
  orderId: string;
  paymentId: string;
  paymentExpiresAt: string;
  statusDetail: string | null;
  qrCodeBase64: string | null;
  qrCode: string | null;
}) {
  const sql = getDb();
  await sql`
    update public.orders
    set status = 'pending'::public.order_status,
        payment_status = 'pending'::public.payment_status,
        payment_id = ${input.paymentId},
        payment_expires_at = ${input.paymentExpiresAt},
        payment_provider = 'mercado_pago',
        payment_status_detail = ${input.statusDetail},
        pix_qr_code = ${input.qrCodeBase64},
        pix_copy_paste = ${input.qrCode},
        canceled_at = null
    where id = ${input.orderId}::uuid
  `;
}

export async function loadPaymentState(orderId: string) {
  const sql = getDb();
  const rows = await sql`
    select id, status, payment_status, payment_id, paid_at, canceled_at, payment_expires_at
    from public.orders
    where id = ${orderId}::uuid
    limit 1
  `;

  return (
    (rows[0] as
      | {
          id: string;
          status: OrderStatus;
          payment_status: PaymentStatus;
          payment_id: string | null;
          paid_at: string | null;
          canceled_at: string | null;
          payment_expires_at: string | null;
        }
      | undefined) ?? null
  );
}

export async function applyPaymentUpdate(input: {
  orderId: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  paymentStatusDetail: string | null;
  paymentProvider: string;
  paymentId: string | null;
  paymentExpiresAt?: string | null;
  paidAt?: string | null;
  canceledAt?: string | null;
}) {
  const sql = getDb();
  await sql`
    update public.orders
    set payment_status = ${input.paymentStatus}::public.payment_status,
        status = ${input.orderStatus}::public.order_status,
        payment_status_detail = ${input.paymentStatusDetail},
        payment_provider = ${input.paymentProvider},
        payment_id = coalesce(${input.paymentId}, payment_id),
        payment_expires_at = coalesce(${input.paymentExpiresAt ?? null}, payment_expires_at),
        paid_at = ${input.paidAt ?? null},
        canceled_at = ${input.canceledAt ?? null}
    where id = ${input.orderId}::uuid
  `;
}

export async function loadOrderStatus(orderId: string) {
  const sql = getDb();
  const rows = await sql`
    select status, payment_status, canceled_at
    from public.orders
    where id = ${orderId}::uuid
    limit 1
  `;

  return (
    (rows[0] as
      | { status: OrderStatus; payment_status: PaymentStatus; canceled_at: string | null }
      | undefined) ?? null
  );
}

export async function updateOrderStatus(input: {
  orderId: string;
  status: OrderStatus;
  paymentStatus?: PaymentStatus | null;
}) {
  const sql = getDb();
  await sql`
    update public.orders
    set status = ${input.status}::public.order_status,
        payment_status = coalesce(
          ${input.paymentStatus ?? null}::public.payment_status,
          payment_status
        ),
        canceled_at = case
          when ${input.status}::public.order_status = 'cancelled'::public.order_status
            and canceled_at is null
            then now()
          else canceled_at
        end
    where id = ${input.orderId}::uuid
  `;
}
