import { FAQS, PRODUCT } from "../../lib/product";

export default function ProductFaq() {
  return (
    <section id="faq" className="container-x py-16 sm:py-20" aria-labelledby="faq-title">
      <div className="grid gap-8 lg:grid-cols-[.7fr_1.3fr]">
        <div><p className="eyebrow">Before your first service</p><h2 id="faq-title" className="mt-3 text-3xl font-bold sm:text-4xl">What your team should know.</h2>
          <p className="mt-4 leading-7 text-slate-300">Current focus: Windows desktop. Start with a rehearsal using your own service audio, Bible files and display setup.</p>
          <p className="mt-4 text-sm text-slate-400">Product information updated {PRODUCT.updated}.</p>
        </div>
        <div className="space-y-3">{FAQS.map((item) => <details key={item.question} className="glass rounded-2xl p-5">
          <summary className="cursor-pointer text-base font-semibold leading-6 marker:text-blue-300">{item.question}</summary>
          <p className="mt-4 text-sm leading-7 text-slate-300">{item.answer}</p>
        </details>)}</div>
      </div>
    </section>
  );
}
