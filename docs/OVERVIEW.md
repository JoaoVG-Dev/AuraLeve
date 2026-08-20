# AuraLeve — Project Overview

## 1. Project Summary

**Project:** AuraLeve  
**Type:** E-commerce for handmade accessories  
**Product Owner and Developer:** João Vitor Guidoti  
**Business Owner:** AuraLeve administrator  
**Tech Lead:** Claude  
**Status:** Ready for business rules, status transitions, data modeling, and architecture  
**Stack:** Laravel 13, React, TypeScript, Inertia.js, PostgreSQL  

AuraLeve is a handmade accessories brand focused on original pieces made with natural stones, wood, beads, and other selected materials.

The initial catalog includes japamalas, seven-knot bracelets, patuá necklaces, natural stone bracelets, natural stone necklaces, and other handmade accessories.

Each product combines craftsmanship, selected materials, symbolic meaning, and intention.

---

## 2. Objective

Build a secure, responsive, and maintainable online store for sales throughout Brazil.

The system must centralize:

- Catalog;
- Categories and optional subcategories;
- Product availability and inventory;
- Customers;
- Orders;
- Payments;
- Shipping and tracking;
- Store administration.

---

## 3. Product Value

AuraLeve communicates three principles:

1. **Authenticity** — original handmade products;
2. **Intention** — meaningful materials and compositions;
3. **Connection** — a relationship between aesthetics, energy, and personal identity.

---

## 4. MVP Scope

The MVP includes:

- Public storefront;
- Customer area;
- Administrative panel.

### 4.1 Public Storefront

- Home page;
- Product catalog;
- Categories and subcategories;
- Simple database search and filters;
- Product detail page;
- Image gallery;
- Material and meaning information;
- Cart;
- Checkout;
- Institutional pages;
- Contact;
- Store policies.

A dedicated search engine is out of scope.

### 4.2 Customer Area

- Registration and login;
- Password recovery;
- Personal data;
- Address management;
- Order history;
- Order tracking.

An authenticated account is mandatory to complete checkout.

### 4.3 Administrative Panel

- Minimal dashboard;
- Recent orders;
- Low-stock alerts;
- Category, subcategory, and product CRUD;
- Image and inventory management;
- Customer and order management;
- Payment status consultation;
- Order status updates;
- Shipping and tracking registration;
- Proof-of-posting upload;
- Basic store settings.

Advanced analytics are out of scope.

---

## 5. Product and Availability Rules

Each product may include:

- Name and slug;
- Short and full descriptions;
- Category;
- Optional subcategory;
- Regular and promotional prices;
- Ready-stock quantity;
- Availability configuration;
- Production lead time;
- Materials and stones;
- Meaning or intention;
- Care instructions;
- Weight and dimensions;
- Main and additional images;
- Status;
- Featured flag.

### 5.1 Categories and Subcategories

- A category may contain many subcategories;
- A subcategory belongs to one category;
- A product belongs to one category;
- A product may exist without a subcategory.

The product subcategory foreign key must be nullable.

### 5.2 Availability

Products may operate as:

- **Ready stock:** limited to the available quantity;
- **Made to order:** available only after ready stock reaches zero, provided the item can be reproduced;
- **Unique piece:** cannot be reproduced after sale;
- **Unavailable:** cannot be purchased.

For reproducible products:

- Ready stock is consumed first;
- While stock is available, the product is sold as ready stock;
- When stock reaches zero, the product becomes available as made to order;
- The production lead time must be shown before purchase;
- The order item must preserve the lead time displayed at checkout.

Customer delivery estimates must consider:

```text
Production lead time + Correios delivery estimate
```

Unrestricted negative inventory is not allowed.

---

## 6. Cart, Checkout, and Inventory Reservation

The customer may:

- Add, remove, and update products;
- Review totals;
- Select an address;
- Select shipping;
- Select payment;
- Review and place the order.

The cart may exist before login, but it must be associated with or merged into the customer account before checkout.

The backend must recalculate prices, shipping, discounts, and totals.

### 6.1 Reservation Rule

Inventory reservation begins when the order enters `Awaiting payment`.

Rules:

- Ready-stock and unique items must be reserved atomically;
- Reserved units cannot be sold to another customer;
- Reservation operations must use database transactions and locking;
- Reservations must be released when payment expires, fails permanently, or the order is cancelled;
- Reservation expiry must follow the payment expiry configured for the order;
- The initial default is 30 minutes and must remain configurable;
- Made-to-order items do not consume ready stock after stock reaches zero.

This behavior must be covered by the status transition matrix and automated tests.

---

## 7. Payments

**Provider:** Mercado Pago  
**Integration:** Checkout Bricks  
**Component:** Payment Brick  

Payment methods at launch:

- PIX;
- Credit card;
- Debit card, when supported by Mercado Pago.

Rules:

- Payment takes place inside the AuraLeve website;
- The backend creates and validates payments;
- Every payment request uses an idempotency key;
- Payment confirmation occurs through validated webhooks;
- Repeated webhook events must not duplicate operations;
- Sensitive card data must not be stored;
- The system must support approved, pending, rejected, expired, cancelled, and refunded payments;
- Sandbox scenarios must be validated before production.

---

## 8. Shipping and Tracking

**Provider:** Correios API using the business owner's existing account or contract.

The integration must support:

- Available services;
- Shipping cost calculation;
- Delivery estimates;
- Selected service registration;
- Tracking after posting.

The selected service, shipping cost, and delivery estimate must be stored as order snapshots.

The project must define:

- Origin postal code;
- Allowed Correios services;
- Package weight and dimension rules.

### 8.1 API Failure

If the Correios API is unavailable:

- Checkout must be blocked;
- No cached, estimated, manual, or fallback rates may be used;
- The customer must receive a clear temporary-unavailability message;
- The event must be logged;
- Checkout may resume only after a valid quote is returned.

---

## 9. Orders and Statuses

Each order must preserve:

- Customer;
- Delivery address snapshot;
- Items and quantities;
- Price snapshots;
- Availability state snapshot;
- Production lead-time snapshot;
- Shipping service and cost;
- Delivery estimate;
- Total amount;
- Payment method and status;
- Internal order status;
- Tracking data;
- Status history;
- Relevant timestamps.

### 9.1 Internal Statuses

- Awaiting payment;
- Payment approved;
- In production;
- In preparation;
- Ready to ship;
- Shipped;
- In transit;
- Out for delivery;
- Delivered;
- Payment expired;
- Cancelled;
- Return requested;
- Returning;
- Product returned;
- Refund pending;
- Refunded.

### 9.2 Responsibility Boundaries

- **Mercado Pago:** payment states and financial refund confirmation;
- **Administrator:** production, preparation, posting, cancellations, and return receipt;
- **Correios:** logistical tracking events;
- **System:** transition validation, stock reservation, reservation release, and status history.

Correios must update only logistical statuses.

A returned product must move to `Product returned` or `Refund pending` before `Refunded`.

Detailed transition rules will be defined in a separate matrix.

---

## 10. Fiscal Document

The applicable fiscal document will be sent to the customer by email.

The provider is not yet selected.

Before implementation, confirm with the responsible accountant:

- Applicable document type;
- Seller tax classification;
- State and municipality requirements;
- Issuance timing;
- Cancellation rules;
- Required customer data;
- Whether automatic integration is mandatory.

The data model must remain provider-neutral.

---

## 11. Access Profiles

### Customer

- Manage account and addresses;
- Purchase products;
- Review orders;
- Track deliveries.

### Administrator

- Manage catalog, categories, subcategories, images, and inventory;
- Review customers;
- Manage orders;
- Update production and preparation;
- Register shipment and tracking;
- Upload proof of posting;
- Process cancellations and returns;
- Manage store settings.

The MVP will have one primary administrator.

---

## 12. Technology Stack

### Application

- Laravel 13;
- PHP;
- React;
- TypeScript;
- Inertia.js;
- Eloquent ORM.

### Database

- PostgreSQL hosted on Neon;
- Versioned migrations;
- Seeders and factories;
- Relational constraints.

### File Storage

- Cloudflare R2;
- S3-compatible Laravel integration;
- Product images;
- Optimized variants;
- Thumbnails;
- Proof-of-posting files.

PostgreSQL stores only file metadata and paths.

---

## 13. Database Decision

The change from MySQL to PostgreSQL was intentional.

PostgreSQL was selected for:

- Strong transactional behavior;
- Reliable concurrency control;
- Native features for simple database-level search;
- Laravel and Eloquent compatibility;
- Better consistency for orders, payments, and inventory.

Neon was selected for:

- Managed PostgreSQL;
- Environment isolation;
- Branching for testing and development;
- Reduced infrastructure management;
- Production-like test environments.

### 13.1 Production Configuration

- Autosuspend will be disabled;
- Production compute must remain warm;
- Customer-facing requests must not depend on cold starts;
- Pooled connections may be used by the application;
- A separate direct, non-pooled connection must be used for migrations and administrative operations;
- Connection settings must be documented in the deployment guide.

This decision must also be recorded in the architecture decision log.

---

## 14. Architecture Direction

The MVP will use a Laravel monolith with React and Inertia.js in the same application.

This provides:

- Simpler authentication;
- Lower operational complexity;
- Faster delivery;
- Easier validation and authorization;
- Simpler deployment;
- A single source of application behavior.

A public API may be introduced later for mobile applications or external integrations.

External integrations:

```text
AuraLeve
├── Mercado Pago
├── Correios
├── Cloudflare R2
├── Neon PostgreSQL
├── Email service
└── Future fiscal provider
```

---

## 15. Initial Entities

- Users;
- Addresses;
- Categories;
- Subcategories;
- Products;
- Product images;
- Inventory reservations;
- Inventory movements;
- Carts;
- Cart items;
- Orders;
- Order items;
- Payments;
- Shipments;
- Order status history;
- Audit events;
- Store settings.

Order status history and critical-operation logging must follow one consistent auditing strategy.

---

## 16. Non-Functional Requirements

### Security

- Secure password hashing;
- CSRF protection;
- Input validation;
- Role-based authorization;
- Webhook validation;
- Login rate limiting;
- No sensitive card storage;
- Idempotent payment processing;
- Critical-operation auditing.

### Usability and Accessibility

- Simple navigation;
- Short checkout;
- Clear feedback;
- Confirmation for destructive actions;
- Mobile-first interface;
- Keyboard navigation;
- Adequate contrast;
- Alternative image text;
- Visible focus states;
- Semantic structure.

### Performance

- Image optimization;
- Pagination;
- Efficient queries;
- Lazy loading where appropriate;
- Cache only when justified;
- Warm production database compute.

### Privacy

- Minimum necessary data collection;
- Personal-data protection;
- Privacy policy;
- LGPD compliance.

### Testing

Automated tests are mandatory for:

- Authentication;
- Product availability;
- Inventory reservation and concurrency;
- Reservation expiry;
- Cart and checkout;
- Payment webhooks;
- Order transitions;
- Shipping calculations;
- Correios API failure behavior;
- Authorization.

---

## 17. Design Guidelines

The implementation must follow the official AuraLeve Design System.

Principles:

- Mobile first;
- Fidelity to the approved visual identity;
- Light and welcoming presentation;
- Emphasis on product photography;
- Clear communication of materials and meaning;
- Consistent colors, typography, spacing, and components;
- Minimal checkout steps;
- Simple administrative experience.

**Figma:**  
<https://www.figma.com/design/rR4Mnhs8U3NU0dNzGgwtvE/AuraLeve-%E2%80%94-Design-System?node-id=0-1>

---

## 18. Project Principles

Priority order:

1. Simplicity;
2. Security;
3. Maintainability;
4. Mobile-first design;
5. Clear business rules;
6. Automated testing;
7. Fast delivery of a functional MVP.

Avoid:

- Premature abstractions;
- Microservices;
- Unnecessary dependencies;
- Features outside the MVP;
- Infrastructure without an immediate need.

---

## 19. Team Structure

AuraLeve will use specialized conversations and execution environments to separate leadership, planning, review, and implementation.

### 19.1 Claude — Tech Lead

Responsibilities:

- Review architecture;
- Validate technical decisions;
- Identify risks and inconsistencies;
- Prevent overengineering;
- Review critical implementation plans;
- Approve or reject high-impact decisions;
- Explain trade-offs.

Claude must not act as the primary developer or generate implementation code unless explicitly requested.

### 19.2 ChatGPT — Planning and Review Team

Suggested conversations:

- `AURALEVE — PRODUCT`
- `AURALEVE — ARCHITECTURE`
- `AURALEVE — FRONTEND`
- `AURALEVE — BACKEND`
- `AURALEVE — DATABASE`
- `AURALEVE — QA`
- `AURALEVE — SECURITY`
- `AURALEVE — DEVOPS`
- `AURALEVE — DOCUMENTATION`

Responsibilities:

- Analyze requirements;
- Define business and technical rules;
- Prepare architecture proposals;
- Produce implementation plans;
- Define acceptance criteria;
- Review implementation results;
- Maintain documentation;
- Prepare precise tasks for Codex.

### 19.3 Codex — Execution Team

Suggested areas:

- `CODEX — FRONTEND`
- `CODEX — BACKEND`
- `CODEX — DATABASE`
- `CODEX — QA`
- `CODEX — DEVOPS`

Responsibilities:

- Implement approved tasks;
- Run tests;
- Fix defects;
- Perform controlled refactoring;
- Update related technical documentation;
- Report missing or conflicting requirements;
- Avoid inventing business rules.

### 19.4 Why the Team Is Separated

The separation exists to:

- Reduce role confusion;
- Prevent one agent from planning, approving, and implementing the same critical decision without review;
- Keep discussions focused by area;
- Improve traceability;
- Reduce architecture drift;
- Prevent undocumented rules;
- Improve task quality before implementation;
- Create clear accountability.

Operating model:

```text
Business need
    ↓
Specialized ChatGPT analysis
    ↓
Claude review for high-impact decisions
    ↓
Approved implementation plan
    ↓
Specialized Codex execution
    ↓
Automated tests
    ↓
Specialized ChatGPT review
    ↓
Claude validation for critical or architectural changes
```

Claude should be involved in:

- Architecture changes;
- Database schema changes;
- External integrations;
- Security-sensitive behavior;
- New critical dependencies;
- Scope changes;
- Cross-area conflicts;
- High-risk payment, inventory, or order logic.

### 19.5 Area Boundaries

- Frontend must not redefine backend contracts alone;
- Backend must not change the database model without database review;
- Database work must not redefine business rules;
- QA must not change expected behavior without updating requirements;
- Codex must not invent missing requirements;
- Technical decisions must be documented before implementation.

---

## 20. Source of Truth

Shared memory is useful, but official documentation is the source of truth.

Recommended files:

```text
docs/
├── PROJECT_OVERVIEW.md
├── BUSINESS_RULES.md
├── FUNCTIONAL_REQUIREMENTS.md
├── ARCHITECTURE.md
├── DATABASE.md
├── ORDER_STATUS_MATRIX.md
├── ROADMAP.md
├── TESTING_STRATEGY.md
├── DECISIONS.md
└── AGENTS.md
```

No agent may:

- Create unapproved business rules;
- Change architecture without documentation;
- Expand scope without approval;
- Ignore the Design System;
- Implement features outside the roadmap.

Missing or conflicting requirements must be reported instead of assumed.

---

## 21. Out of Scope

- Native mobile application;
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
- Advanced analytics.

---

## 22. MVP Success Criteria

The MVP is complete when:

- The administrator can manage categories, subcategories, and products;
- Products may exist without subcategories;
- Availability rules work correctly;
- Inventory reservation and expiry work safely;
- Customers can browse the catalog;
- The cart works;
- Authenticated customers can complete checkout;
- PIX, credit card, and supported debit card payments work;
- Payment webhooks are secure and idempotent;
- Checkout blocks correctly when Correios is unavailable;
- Correios calculates shipping and updates logistics;
- Orders appear correctly in the administrative panel;
- The administrator can manage production, preparation, and shipment;
- Returns and refunds follow valid transitions;
- Customers can review and track orders;
- Product images are stored in Cloudflare R2;
- PostgreSQL runs on Neon with autosuspend disabled in production;
- The application works well on mobile devices;
- The Design System is applied consistently;
- Critical flows are covered by automated tests;
- The system is documented and ready for production.

---

## 23. Main Risks

- Scope growth;
- Payment or webhook failures;
- Overselling ready-stock or unique products;
- Reservation expiry failures;
- Incorrect production lead times;
- Incorrect shipping calculations;
- Correios API downtime;
- Invalid order transitions;
- Image storage failures;
- Personal-data exposure;
- Fiscal requirements discovered too late;
- Divergent decisions between agents;
- Undocumented changes across specialized conversations.

---

## 24. Next Steps

1. Tech Lead final approval;
2. Detailed business rules;
3. Order status transition matrix;
4. PostgreSQL data model;
5. Technical architecture;
6. Main system flows;
7. Development roadmap;
8. Coding standards;
9. Testing strategy;
10. Agent instruction files.

---

## 25. Document Control

| Field | Value |
|---|---|
| Document | Project Overview |
| Project | AuraLeve |
| Version | 6.0 |
| Status | Optimized for final Tech Lead approval |
| Responsible | João Vitor Guidoti |
| Date | July 8, 2026 |