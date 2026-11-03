# VerseCue commercial discussion — 29 October 2026

Status: proposals for discussion, not approved offers or public website pricing. Market: Nigerian and international churches together. No checkout, subscriptions or desktop licence enforcement has been implemented by this website update.

## Product positioning

Sell the operational benefit: local sermon-to-Scripture assistance, a controllable queue, preview before projection, and a dependable volunteer workflow. A general presentation app alone competes with capable free tools. Validate detection quality with actual churches, including Nigerian accents and mixed-language sermons; a multilingual recogniser is not evidence that scripture detection works reliably in every language.

## Recommended first offer

Start with one Church plan per physical location: one live presentation computer plus one preparation/backup computer, a 30-day trial, and optional monthly or annual billing. These are proposed licence terms requiring implementation, not current app capabilities.

| Proposed plan | Nigeria | International | Scope |
| --- | --- | --- | --- |
| Church monthly | NGN 7,500/month | USD 15/month | Local speech detection, previews, queues, service plans and existing media tools; updates and normal support |
| Church annual | NGN 75,000/year | USD 150/year | Same features, discounted annual payment |
| Multiple locations | Quoted after discovery | Quoted after discovery | Location count, activation allowances, onboarding and support commitments agreed in writing |

These are willingness-to-pay hypotheses, not verified market rates or currency conversions. Test them with paid pilots before publishing. Prices need a defined treatment for applicable taxes, payment fees and any licensed content costs. Avoid invented plan features such as cloud collaboration or remote mobile control; those are not part of the inspected desktop build.

Additional revenue: fixed-scope installation and operator training, paid migration/import assistance, denominational deployment agreements, and original/appropriately licensed media packs. Price services from actual delivery time and travel. Optional contributions can remain a separate support channel, clearly distinguished from purchasing a licence.

## Other viable business models

- Perpetual licence for the current major version, with 12 months of updates/support and optional paid maintenance: attractive to offline churches, but revenue is less predictable.
- Free manual presentation with paid speech assistance: easier entry against free competitors, but requires a clear feature boundary and more licensing/product work.
- Donation-only: simple to start, but poor predictability for ongoing support and testing.

Do not offer unlimited lifetime updates/support without understanding the ongoing cost. Do not meter verses or sermon minutes for the local engine. Do not introduce advertising on a congregation's output.

## Benchmark evidence, checked 29 October 2026

- Renewed Vision publishes ProPresenter Standard at USD 29/month or USD 289/year per seat: https://renewedvision.com/propresenter/all-features
- EasyWorship Basic starts at USD 17.50/month when billed USD 210/year; pricing depends on attendance and includes a campus licence: https://easyworship.com/software/pricing
- FreeShow is a free/open-source presentation alternative: https://freeshow.app/docs

These products differ in scope and maturity. The benchmarks do not establish that VerseCue buyers will pay the proposed prices.

## Payments and dependable offline use

Nigeria: evaluate Paystack checkout for local collection and invoiced annual bank-transfer payments. Its recurring subscription API supports cards and Nigerian direct debit, not arbitrary bank transfers. Its documentation also says failed subscription charges are not automatically retried, so plan for reminders/recovery.

- https://paystack.com/pricing
- https://paystack.com/docs/payments/subscriptions/

International: compare Paystack's enabled international-card collection with a merchant-of-record provider such as Paddle. Paddle's seller approval and contractual terms must be confirmed for the business; its merchant-of-record offering handles transaction sales-tax collection/remittance in supported markets. That does not remove the developer's separate business-tax obligations.

- https://www.paddle.com/help/start/account-verification/which-countries-are-supported-by-paddle
- https://developer.paddle.com/concepts/sell/supported-countries-locales/

Technical work before paid activation: customer accounts, product/price records, verified payment webhooks, refund/cancellation handling, signed device/location licences, a transfer/recovery process, and an offline activation/import path. Licence checks must not interrupt a running service. Define grace periods, expired-plan behavior and emergency access before implementation. Preserve local sermon processing; a licensing backend need not receive sermon audio.

## Content and distribution rights

Confirm the permissions for the exact Bible texts, model weight artifacts, local language models and media shipped commercially. A church's ability to import a file does not establish the application's right to redistribute it. Biblica's current permissions distinguish limited quotations from full Bible licensing; its express licensing route has non-commercial/no-AI criteria. Do not sell a licensed Bible bundle or AI use rights that have not been secured.

- https://www.biblica.com/permissions/
- Exact bundled Parakeet artifact: see the desktop project's ModelFiles/Parakeet/README.md and its upstream attribution/licence provenance.

## Validate before building a large billing system

Run a small paid pilot with Nigerian and international churches. Record successful weekly usage, detection corrections, volunteer onboarding time, support effort, willingness to renew and actual payment completion. Agree the initial price and licence unit after these interviews. Calculate contribution per church after payment fees, licensed-content costs and support time; local inference reduces cloud-compute cost but does not make support free.

Public site policy for now: early access and pricing-not-yet-announced copy only. Publish the agreed plans after approval, not this internal comparison.
