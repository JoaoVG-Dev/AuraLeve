# AuraLeve - Business Rules

| Field | Value |
|---|---|
| Document | Business Rules |
| Project | AuraLeve |
| Version | 2.0 |
| Status | Frozen |
| Owner | João Vitor Guidoti |
| Date | July 12, 2026 |
| Next document | Order Status Matrix |

This document is the source of truth for:

- Order Status Matrix;
- Database Modeling;
- Technical Architecture;
- Frontend flows;
- Backend behavior;
- QA and automated tests.

If a rule is missing or ambiguous, it must be clarified before implementation. Pending decisions must not be silently invented.

---

## Table of Contents

1. Purpose
2. Business Context
3. Glossary
4. User Roles
5. Categories and Subcategories
6. Products
7. Product Status
8. Availability
9. Inventory
10. Cart
11. Customers and Addresses
12. Checkout
13. Payments
14. Shipping
15. Orders
16. Status Ownership
17. Cancellations
18. Returns
19. Refunds
20. Fiscal Documents
21. Images and Files
22. Administration
23. Notifications
24. Security and Privacy
25. Out of Scope
26. Pending Decisions
27. Acceptance Principle
28. Retired Rule Identifiers
29. Document Control
30. Version History

---

## 1. Purpose

This document defines the business rules for the AuraLeve e-commerce MVP.

It governs business behavior for:

- Products;
- Categories and subcategories;
- Product status;
- Availability and inventory;
- Cart and checkout;
- Payments;
- Shipping;
- Orders;
- Cancellations;
- Returns;
- Refunds;
- Fiscal documents;
- Images and files;
- Administrative operations;
- Notifications;
- Security and privacy.

This document is intentionally behavior-focused. Technical implementation details belong in downstream architecture, database, frontend, backend, and QA documents.

---

## 2. Business Context

AuraLeve sells handmade accessories produced with natural stones, wood, beads, and other selected materials.

Products are sold through two availability modes:

- Ready Stock;
- Made to Order.

Availability is derived from ready-stock quantity. While ready stock is greater than zero, the product is sold as Ready Stock. When ready stock reaches zero, the same product automatically becomes Made to Order and remains purchasable under the lead-time rules defined in this document.

The store sells throughout Brazil and will initially be operated by one primary administrator.

Technical implementation decisions are defined in the Project Overview and downstream technical documents and must not override these business rules.

---

## 3. Glossary

**Ready Stock:** A product availability mode backed by finite units that can be reserved and sold.

**Made to Order:** A product availability mode in which customer demand is fulfilled through production after ready stock reaches zero.

**Production Lead Time:** The expected time required to produce a made-to-order item before shipment preparation.

**Draft:** A product status visible only to administrators. Draft products are not customer-facing or purchasable and may be permanently deleted if they have no historical references.

**Published:** The product status that allows customer-facing visibility and purchase when all publication requirements are satisfied.

**Disabled:** A temporary product status that removes a product from sale while preserving historical references.

**Archived:** A product status representing retirement from the active storefront while preserving historical references and auditability.

**Order Snapshot:** A stored copy of business data used at order placement so later catalog changes do not alter historical orders.

---

## 4. User Roles

### Customer

A customer may:

- Create an account;
- Log in;
- Manage personal data and addresses;
- Add products to the cart;
- Complete checkout;
- Pay for orders;
- Review order history;
- Track shipments;
- Request cancellation or return when eligible.

A customer must be authenticated before completing checkout.

### Administrator

The administrator may:

- Manage categories and subcategories;
- Manage products and images;
- Manage inventory;
- Review customers;
- Manage orders;
- Update production and preparation statuses;
- Register shipment data;
- Upload proof of posting;
- Process cancellations;
- Confirm returned products;
- Manage refund workflows;
- Manage basic store settings.

---

## 5. Categories and Subcategories

### BR-CAT-001 - Category requirement

Every product must belong to one category.

### BR-CAT-002 - Optional subcategory

A product may exist without a subcategory.

### BR-CAT-003 - Shared subcategory relationship

A category may have many subcategories, and a subcategory may belong to one or more categories.

### BR-CAT-004 - Product consistency

When a product uses a subcategory, that subcategory must be linked to the selected category.

### BR-CAT-005 - Category deactivation

Deactivating a category must not deactivate a shared subcategory that remains linked to another category.

### BR-CAT-006 - Subcategory reuse

Shared subcategories should be reused instead of duplicated whenever possible.

### BR-CAT-007 - Duplicate-prevention strategy

The final duplicate-prevention mechanism for shared subcategories remains a pending business decision and must not be silently chosen during implementation.

### BR-CAT-008 - Historical preservation

Categories and subcategories referenced by products or orders should be deactivated or preserved instead of permanently deleted when historical integrity would be affected.

---

## 6. Products

### BR-PROD-001 - Required data

A product must contain the data required for publication and sale, including:

- Name;
- Slug;
- Description;
- Category;
- Regular price;
- Ready-stock quantity;
- Status;
- Main image.

Production lead time is required whenever the product is sold as Made to Order.

### BR-PROD-002 - Optional data

A product may contain:

- Subcategory;
- Promotional price;
- Additional images;
- Materials;
- Stones;
- Meaning or intention;
- Care instructions;
- Weight;
- Dimensions;
- Featured flag.

### BR-PROD-003 - Publication

A product may be customer-facing and purchasable only when:

- Status is Published;
- The category is active;
- Required product data is complete;
- The price is valid;
- A main image exists.

### BR-PROD-004 - Price validation

The regular price must be greater than zero.

A promotional price must:

- Be greater than zero;
- Be lower than the regular price.

### BR-PROD-005 - Backend authority

The backend is the source of truth for prices, product status, availability, inventory, and checkout totals.

Frontend values must never be trusted as authoritative.

### BR-PROD-006 - Order snapshots

Order items must preserve:

- Product name;
- Product identifier;
- Unit price;
- Promotional price, when applicable;
- Availability mode;
- Production lead time;
- Product status at order placement when relevant to auditability.

Later product changes must not alter historical orders.

### BR-PROD-007 - Product deletion

Product deletion must follow the Product Status deletion rules in BR-STA-006.

---

## 7. Product Status

Product Status controls publication, visibility, and sale eligibility. Product Availability controls whether a Published product is fulfilled from Ready Stock or Made to Order.

### BR-STA-001 - Allowed product statuses

The allowed Product Status values are:

- Draft;
- Published;
- Disabled;
- Archived.

No other Product Status may be introduced without updating this document.

### BR-STA-002 - Draft

Draft products:

- Are visible only to administrators;
- Are not purchasable;
- May be permanently deleted if they have never been referenced by an order.

### BR-STA-003 - Published

Published products:

- Are visible to customers;
- Are searchable;
- Are displayed in catalog and category pages;
- Are purchasable when all publication requirements are satisfied.

### BR-STA-004 - Disabled

Disabled products:

- Are temporarily removed from sale;
- Are not purchasable;
- May return to Published through explicit administrator action;
- Must remain available to historical order references.

Disabled is temporary and reversible.

### BR-STA-005 - Archived

Archived products:

- Are removed from the active storefront;
- Are not purchasable;
- Are preserved for historical orders and auditability;
- May only return through explicit administrator action if the business allows it.

Archived represents retirement from the active catalog.

### BR-STA-006 - Deletion rules

Draft products with no historical references may be hard-deleted.

Products that were Published, Disabled, Archived, or referenced by orders must not be permanently deleted. Use deactivation, archival, or soft deletion as appropriate.

### BR-STA-007 - Valid transitions

The concise Product Status transitions are:

| Transition | Validity | Rule |
|---|---|---|
| Draft to Published | Allowed | Publication requirements must be satisfied. |
| Draft to Archived | Allowed | Used when an unpublished product should be retired or preserved. |
| Published to Disabled | Allowed | Used for temporary removal from sale. |
| Disabled to Published | Allowed | Requires explicit administrator action and publication requirements. |
| Published to Archived | Allowed | Used for retirement from the active catalog. |
| Disabled to Archived | Allowed | Used when a temporarily removed product is retired. |
| Archived to Published | Conditional | Allowed only through explicit administrator action, when business policy allows reactivation, and all publication requirements are satisfied. |

The transitions listed in this table are exhaustive. Any Product Status transition not explicitly listed is prohibited unless this document is formally updated.

---

## 8. Availability

### BR-AVL-001 - Availability modes

A Published product may be sold through only these availability modes:

- Ready Stock;
- Made to Order.

Availability is derived automatically from ready-stock quantity.

### BR-AVL-002 - Ready Stock

While ready stock is greater than zero:

- The product is sold as Ready Stock;
- Sales are limited by finite ready-stock quantity;
- Quantity must be validated before order creation;
- Stock reservation begins when the order enters `Awaiting payment`.

### BR-AVL-003 - Made to Order

When ready stock reaches zero:

- The same product automatically becomes Made to Order;
- The product remains purchasable if it is Published and satisfies publication requirements;
- Production lead time must be shown on the product page before the customer adds the item to the cart;
- Production lead time must remain visible throughout cart and checkout;
- The order item must preserve the displayed production lead time.

### BR-AVL-006 - Negative inventory

Unrestricted negative inventory is not allowed.

Made-to-order sales create production demand and must not be implemented as unrestricted negative stock.

---

## 9. Inventory

### BR-INV-001 - Reservation timing

Inventory reservation starts when an order enters `Awaiting payment`.

### BR-INV-002 - Reservation duration

The initial reservation period is 30 minutes.

It must remain configurable.

### BR-INV-003 - Reservation release

A reservation must be released when:

- Payment expires;
- Payment is permanently rejected;
- The order is cancelled under an eligible cancellation rule;
- The payment process is abandoned beyond the configured expiration.

### BR-INV-004 - Concurrency safety

Atomic reservation applies only to finite Ready Stock.

Ready-stock units must be reserved atomically. Transactions and locking must prevent duplicate sales.

### BR-INV-005 - Payment approval

When payment is approved:

- Reserved stock becomes sold stock;
- The reservation is finalized;
- Stock must not be deducted twice.

### BR-INV-006 - Made-to-order demand

Made-to-order items generate production demand after ready stock reaches zero.

They do not consume ready stock beyond available finite quantity.

### BR-INV-007 - Audit trail

Every relevant inventory change must be traceable.

Examples:

- Manual increase;
- Manual decrease;
- Reservation;
- Reservation release;
- Sale confirmation;
- Production demand creation;
- Return to stock;
- Inventory correction.

### BR-INV-008 - Returned items

Returned items must not automatically return to sellable stock.

The administrator must inspect and explicitly approve any restocking.

### BR-INV-009 - Inventory idempotency

Inventory operations triggered by payment events, reservation expiry, cancellation, or webhook retries must be idempotent.

The same business event must not reserve, release, deduct, or restore stock more than once.

---

## 10. Cart

### BR-CART-001 - Anonymous cart

A visitor may add products before login.

### BR-CART-002 - Login requirement

The customer must log in before checkout.

### BR-CART-003 - Cart merge

Before checkout, the anonymous cart must be linked to or merged into the authenticated customer cart.

### BR-CART-004 - Revalidation

Before checkout, the system must revalidate:

- Product status;
- Availability mode;
- Quantity;
- Price;
- Promotional price;
- Production lead time;
- Shipping eligibility.

### BR-CART-005 - Scenario A: Ready Stock becomes Made to Order

If a cart item was added as Ready Stock and later becomes Made to Order before order placement:

- Checkout must not be blocked automatically;
- The customer must be informed;
- The new production lead time must be shown;
- The customer must acknowledge or review the change before placing the order;
- The customer may continue after acknowledging or reviewing the change.

### BR-CART-006 - Scenario B: Product status changes

If a cart item changes to any status other than Published before order placement:

- Checkout must be blocked;
- The customer must be informed;
- The cart must be corrected before order placement.

### BR-CART-007 - Price and lead-time changes

If price, promotional price, or production lead time changes before order placement, the customer must be informed before the order is placed.

### BR-CART-008 - Quantity

Requested quantity must be a positive integer.

Maximum quantity per product per order remains pending.

---

## 11. Customers and Addresses

### BR-CUS-001 - Account requirement

Every order must belong to an authenticated customer.

### BR-CUS-002 - Unique email

Each customer account must use a unique valid email address.

### BR-CUS-003 - Address ownership

Customers may only access and modify their own addresses.

### BR-CUS-004 - Address snapshot

Orders must preserve the delivery address used at checkout.

Later changes must not modify existing orders.

### BR-CUS-005 - Required fields

Delivery addresses must contain all fields required by Correios and the selected fiscal process.

The final field list remains pending.

---

## 12. Checkout

### BR-CHK-001 - Authenticated checkout

Checkout is available only to authenticated customers.

### BR-CHK-002 - Backend calculation

The backend must calculate and validate:

- Subtotal;
- Promotional prices;
- Shipping cost;
- Discounts, if introduced later;
- Final total.

### BR-CHK-003 - Valid shipping quote

A valid Correios quote is mandatory before order placement.

### BR-CHK-004 - Correios failure

If the Correios API cannot return a valid quote:

- Checkout must be blocked;
- Cached, manual, estimated, or fallback freight rates must not be used;
- The customer must receive a clear message that checkout cannot proceed until a valid quote is returned;
- The failure must be logged.

### BR-CHK-005 - Order creation

An order may be created only after:

- Customer validation;
- Address validation;
- Cart validation;
- Inventory validation;
- Shipping validation;
- Final total calculation.

---

## 13. Payments

### BR-PAY-001 - Provider

Mercado Pago is the payment provider.

### BR-PAY-002 - Integration

Mercado Pago Checkout Bricks with Payment Brick will be used.

### BR-PAY-003 - Payment methods

Launch methods:

- PIX;
- Credit card;
- Debit card, when supported by Mercado Pago.

### BR-PAY-004 - In-site payment

Payment must occur inside the AuraLeve website.

### BR-PAY-005 - Sensitive data

AuraLeve must not store sensitive card data.

### BR-PAY-006 - Idempotency

Every payment creation request must use an idempotency key.

Repeated requests must not create duplicate payments.

### BR-PAY-007 - Authoritative confirmation

Payment changes must be confirmed through validated Mercado Pago webhooks or authoritative API verification.

Frontend success screens are not proof of payment.

### BR-PAY-008 - Duplicate webhook protection

Repeated webhooks must not:

- Confirm the same order twice;
- Deduct stock twice;
- Trigger duplicate notifications;
- Trigger duplicate refunds.

### BR-PAY-009 - Supported payment states

The system must support these payment states:

- Pending;
- Approved;
- Rejected;
- Expired;
- Cancelled;
- Refunded.

### BR-PAY-010 - Approval

An order may move to `Payment approved` only after authoritative confirmation.

### BR-PAY-011 - Expiration

When payment expires:

- The order moves to `Payment expired`;
- Reserved inventory is released;
- Handling of later payment confirmation after reservation expiry remains pending.

### BR-PAY-012 - Payment records

Payment records must preserve:

- Provider;
- External payment identifier;
- Order identifier;
- Method;
- Amount;
- Status;
- Idempotency reference;
- Relevant timestamps.

### BR-PAY-013 - Refund confirmation

Refund processing and final refund confirmation must follow the Refund business rules defined in Section 19.

---

## 14. Shipping

### BR-SHP-001 - Provider

Shipping calculation and tracking use the Correios API.

### BR-SHP-002 - Contract

The integration uses the business owner's existing Correios account or contract.

### BR-SHP-003 - Quote data

A quote must contain:

- Service;
- Cost;
- Estimated delivery time;
- Origin postal code;
- Destination postal code;
- Package data used in calculation.

### BR-SHP-004 - Shipping snapshot

The selected service, cost, and estimate must be stored in the order.

### BR-SHP-005 - Production lead time

For made-to-order items:

```text
Customer estimate = production lead time + Correios delivery estimate
```

### BR-SHP-006 - Posting

The administrator must register shipment data after posting.

### BR-SHP-007 - Proof of posting

Proof of posting must be uploaded and linked to the shipment.

### BR-SHP-008 - Tracking scope

Correios may update only logistical states.

It must not control:

- Payment;
- Production;
- Cancellation;
- Refund.

### BR-SHP-009 - Delivery incidents

Delayed, lost, damaged, or returned shipments must be recorded.

Detailed handling remains pending.

### BR-SHP-010 - No fallback freight rates

Checkout requires a current valid Correios quote.

Cached, manual, estimated, or fallback freight rates must not be used for order placement.

---

## 15. Orders

### BR-ORD-001 - Historical integrity

Catalog changes must not alter historical orders.

### BR-ORD-002 - Required data

An order must preserve:

- Customer;
- Delivery address snapshot;
- Items and quantities;
- Unit prices;
- Availability snapshot;
- Production lead-time snapshot;
- Shipping service and cost;
- Delivery estimate;
- Total amount;
- Payment method and status;
- Internal status;
- Tracking data;
- Status history;
- Relevant timestamps.

### BR-ORD-003 - Status history

Every status change must record:

- Previous status;
- New status;
- Trigger source;
- Responsible actor, when applicable;
- Timestamp;
- Optional reason.

### BR-ORD-004 - Valid transitions

Orders may only follow transitions defined in the Order Status Matrix.

### BR-ORD-005 - Manual status changes

The administrator must not bypass invalid transitions.

### BR-ORD-006 - Order number

Every order must have a unique customer-facing identifier.

The format remains pending.

---

## 16. Status Ownership

### Mercado Pago

Responsible for:

- Payment pending;
- Payment approved;
- Payment rejected;
- Payment expired;
- Payment cancelled;
- Refund confirmation.

### Administrator

Responsible for:

- In production;
- In preparation;
- Ready to ship;
- Posting confirmation;
- Cancellation approval;
- Return receipt;
- Restocking approval.

### Correios

Responsible for:

- Shipped;
- In transit;
- Out for delivery;
- Delivered;
- Returning.

### System

Responsible for:

- Transition validation;
- Inventory reservation;
- Reservation release;
- Status history;
- Duplicate-processing prevention.

---

## 17. Cancellations

### BR-CAN-001 - Customer request

Customers may request cancellation while eligible.

The exact eligibility window remains pending.

### BR-CAN-002 - Before payment approval

Unpaid orders may be cancelled automatically or manually.

Reserved inventory must be released.

### BR-CAN-003 - After payment approval

Cancellation requires:

- Eligibility validation;
- Administrator review or approved automated rule;
- Refund workflow when payment was captured.

### BR-CAN-004 - After shipment

Shipped orders must use the return process.

### BR-CAN-005 - Cancellation reason

Every cancellation must record a reason and responsible actor.

---

## 18. Returns

### BR-RET-001 - Return eligibility

Delivered or shipped orders may require a return workflow.

The eligibility window remains pending.

### BR-RET-002 - Return states

The flow may use:

- Return requested;
- Returning;
- Product returned;
- Refund pending;
- Refunded.

### BR-RET-003 - Physical receipt

Only the administrator may confirm receipt of a returned item.

### BR-RET-004 - Inspection

Returned products must be inspected before:

- Restocking;
- Replacement;
- Refund completion, when required.

### BR-RET-005 - Return shipping

Responsibility for return shipping remains pending.

It may depend on the return reason and applicable law.

---

## 19. Refunds

### BR-REF-001 - Physical return is not financial refund

A returned product does not automatically mean the customer has been refunded.

### BR-REF-002 - Refund pending

After return confirmation, the order may move to `Refund pending`.

### BR-REF-003 - Refund confirmation

The order may move to `Refunded` only after Mercado Pago confirms the financial refund.

### BR-REF-004 - Duplicate refunds

A payment must not be refunded beyond its refundable amount.

### BR-REF-005 - Partial refunds

Partial refunds are not yet defined.

### BR-REF-006 - Refund records

Every refund must preserve:

- Reason;
- Amount;
- Responsible actor;
- Provider reference;
- Relevant timestamps.

---

## 20. Fiscal Documents

### BR-FIS-001 - Delivery

The applicable fiscal document will be sent by email.

### BR-FIS-002 - Provider neutrality

The domain model must remain neutral until a provider is selected.

### BR-FIS-003 - Accounting validation

Before implementation, confirm:

- Applicable fiscal document type;
- Seller tax classification;
- State and municipality requirements;
- Issuance timing;
- Cancellation rules;
- Required customer data;
- Whether automatic integration is mandatory.

### BR-FIS-004 - Order relationship

Fiscal records must be linked to orders without coupling the system to one provider.

---

## 21. Images and Files

### BR-FILE-001 - Storage

Product images and proof-of-posting files will use Cloudflare R2.

### BR-FILE-002 - Database responsibility

PostgreSQL stores only file metadata and paths.

### BR-FILE-003 - Main image

Each Published product must have one main image.

### BR-FILE-004 - Additional images

Products may have multiple ordered images.

### BR-FILE-005 - Accessibility

Product images must support alternative text.

### BR-FILE-006 - Proof-of-posting privacy

Proof-of-posting files must not be publicly exposed without authorization.

---

## 22. Administration

### BR-ADM-001 - Primary administrator

The MVP has one primary administrator.

### BR-ADM-002 - Auditability

Critical actions must be auditable.

Examples:

- Price changes;
- Inventory corrections;
- Status changes;
- Cancellations;
- Refunds;
- Shipment registration;
- Restocking.

### BR-ADM-003 - Destructive actions

Destructive actions require confirmation.

### BR-ADM-004 - Customer data

Customer data may only be used for legitimate store operations.

### BR-ADM-005 - Dashboard scope

The MVP dashboard is limited to:

- Recent orders;
- Low-stock alerts;
- Essential operational indicators.

Advanced analytics are out of scope.

---

## 23. Notifications

### BR-NOT-001 - Required notifications

Customers should be notified about:

- Account verification;
- Password reset;
- Order creation;
- Payment approval;
- Payment failure or expiration;
- Shipment;
- Tracking availability;
- Delivery;
- Cancellation;
- Refund.

### BR-NOT-002 - Confirmed backend state

Notifications must reflect confirmed backend state.

### BR-NOT-003 - Duplicate prevention

Idempotent events must not send duplicate notifications.

### BR-NOT-004 - Channel

Email is the required MVP channel.

---

## 24. Security and Privacy

### BR-SEC-001 - Customer ownership

Customers may only access their own:

- Profile;
- Addresses;
- Cart;
- Orders;
- Payments;
- Shipments.

### BR-SEC-002 - Administrative authorization

Administrative features require administrator authorization.

### BR-SEC-003 - Credentials

Secrets must never be:

- Hardcoded;
- Committed;
- Printed in logs;
- Exposed to the frontend.

### BR-SEC-004 - Data minimization

Only necessary personal data may be collected.

### BR-SEC-005 - LGPD

The system must follow LGPD-aligned privacy practices.

Retention and deletion details remain pending.

### BR-SEC-006 - Audit logs

Audit logs must not expose credentials or sensitive payment data.

---

## 25. Out of Scope

The MVP does not include:

- Marketplace;
- Multiple sellers;
- International sales;
- Loyalty program;
- Subscriptions;
- Affiliate program;
- Full ERP;
- Real-time chat;
- Artificial intelligence;
- Advanced marketing automation;
- Multiple distribution centers;
- Dedicated search infrastructure;
- Advanced analytics;
- Customer reviews;
- Wishlist;
- Complex coupon engine.

---

## 26. Pending Decisions

The following decisions must be resolved before implementation of the affected features:

1. Maximum quantity per product per order;
2. Customer cancellation eligibility window;
3. Return eligibility window;
4. Return shipping responsibility;
5. Lost, delayed, or damaged shipment handling;
6. Partial refunds;
7. Customer-facing order number format;
8. Required customer and address fields;
9. Fiscal document type and provider;
10. Product variants in the MVP;
11. Visibility behavior for Disabled and Archived products in direct links and historical contexts;
12. Restocking criteria for returned products;
13. Email service provider;
14. Data retention and account deletion rules;
15. Late payment confirmation after reservation expiry;
16. Shared subcategory duplicate-prevention strategy.

Pending decisions must not be silently invented.

---

## 27. Acceptance Principle

A feature is acceptable only when:

- It follows this document;
- It follows the Order Status Matrix;
- Backend validation exists;
- Authorization is enforced;
- Critical state changes are auditable;
- Availability behavior is consistent with Ready Stock and Made to Order rules;
- Product Status behavior is consistent with Draft, Published, Disabled, and Archived rules;
- Cart, checkout, inventory, and payment behavior do not contradict each other;
- Relevant automated tests pass;
- No undocumented business rule is introduced.

---

## 28. Retired Rule Identifiers

The following identifiers are retired permanently and must not be reused or renumbered:

| Identifier | Status |
|---|---|
| BR-AVL-004 | Retired permanently. |
| BR-AVL-005 | Retired permanently. |

---

## 29. Document Control

| Field | Value |
|---|---|
| Document | Business Rules |
| Project | AuraLeve |
| Version | 2.0 |
| Status | Frozen |
| Owner | João Vitor Guidoti |
| Date | July 12, 2026 |
| Next document | Order Status Matrix |

---

## 30. Version History

| Version | Status | Date | Notes |
|---|---|---|---|
| 2.0 | Frozen | July 12, 2026 | Final canonical rules frozen after Tech Lead approval and freeze-gate corrections. |
| 1.1 | Tech Lead corrections | July 12, 2026 | Correction set used as source material. |
| 1.0 | Draft | July 12, 2026 | Initial Business Rules document used as source material. |
