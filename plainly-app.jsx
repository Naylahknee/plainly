import React, { useState } from 'react';
import { Copy, Check, ChevronDown } from 'lucide-react';

export default function PlAInly() {
  const [situation, setSituation] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  const generatePrompt = async () => {
    if (!situation.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `You are an expert at translating messy, unclear situations into crystal-clear AI prompts using the R-TACOS framework.

Someone just described their situation to you:
"${situation}"

Generate a complete R-TACOS prompt they can copy and paste directly into any AI tool (Claude, ChatGPT, Gemini, etc). The prompt should have clear sections for Role, Task, Audience, Context, Output, and Specifics.

After the prompt, add a one-line note about what you assumed so they can correct you if needed.

Format it cleanly with headers and make it immediately usable.`
            }
          ],
        })
      });

      const data = await response.json();
      const generatedText = data.content[0].text;
      setPrompt(generatedText);
      setShowPayment(true);
    } catch (error) {
      console.error('Error:', error);
      setPrompt('Error generating prompt. Please try again.');
    }
    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const faqItems = [
    {
      q: "Do I need an account?",
      a: "Nope. Generate your prompt, pay once, use PlAInly forever. No login, no recurring fees."
    },
    {
      q: "Can I use this with any AI tool?",
      a: "Yes. The prompts work with Claude, ChatGPT, Gemini, or any AI platform. Copy and paste anywhere."
    },
    {
      q: "What if the prompt isn't quite right?",
      a: "The framework gives you the language to refine it. Change the Audience, adjust the Context, tweak the Specifics. You're in control."
    },
    {
      q: "Is this just a prompt template?",
      a: "No. PlAInly translates YOUR specific situation into a prompt that works for YOUR problem. That's the difference."
    },
    {
      q: "What does 'Founder Access' mean?",
      a: "You pay $9 once and own it forever. As we add features, you get them. No subscriptions, no price increases."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-6 flex justify-between items-center">
          <img src="/plainly-logo.jpg" alt="PlAInly" className="h-10 w-auto" />
          <p className="text-sm text-slate-600">Talk to AI like a human</p>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
          Stop getting garbage AI results.
        </h2>
        <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
          PlAInly translates what you actually need into a prompt that works. Every time.
        </p>
      </section>

      {/* Two Tier Pricing Overview */}
      <section className="max-w-4xl mx-auto px-6 py-8 mb-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* PlAInly Tier */}
          <div className="border border-slate-200 rounded-lg p-6 bg-white">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">PlAInly</h3>
            <p className="text-3xl font-bold text-blue-600 mb-4">$8</p>
            <p className="text-sm text-slate-600 mb-6">One-time payment. Lifetime access.</p>
            <ul className="text-sm text-slate-700 space-y-2 mb-6">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Translate your situation into a prompt</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Copy and paste ready</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Works with any AI tool</span>
              </li>
            </ul>
          </div>

          {/* PlAInly Pro Tier */}
          <div className="border-2 border-blue-600 rounded-lg p-6 bg-gradient-to-br from-blue-50 to-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-2xl font-bold text-slate-900">PlAInly Pro</h3>
              <span className="text-xs font-semibold bg-blue-600 text-white px-3 py-1 rounded-full">COMING SOON</span>
            </div>
            <p className="text-3xl font-bold text-blue-600 mb-4">$300</p>
            <p className="text-sm text-slate-600 mb-6">Personalized launch roadmap + implementation guide.</p>
            <ul className="text-sm text-slate-700 space-y-2 mb-6">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Everything in PlAInly</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Custom launch roadmap for your project</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Wireframes, color palettes, tool recommendations</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Step-by-step implementation guide</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Tool */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
          <label className="block mb-4">
            <p className="text-sm font-semibold text-slate-900 mb-3">Describe your situation in plain language:</p>
            <textarea
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              placeholder="Example: I need to write an email to my landlord about the broken AC. He keeps ignoring me. I want to sound professional but firm, and I need him to respond in writing within 7 days."
              className="w-full h-40 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </label>

          <button
            onClick={generatePrompt}
            disabled={!situation.trim() || loading}
            className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-slate-300 transition-colors"
          >
            {loading ? 'Translating...' : 'Translate to R-TACOS Prompt'}
          </button>
        </div>

        {/* Output */}
        {prompt && (
          <div className="mt-8 bg-slate-900 text-slate-50 rounded-xl p-8 font-mono text-sm leading-relaxed">
            <div className="flex justify-between items-start mb-6">
              <p className="text-slate-400 text-xs uppercase tracking-wide">Your R-TACOS Prompt</p>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                {copied ? (
                  <>
                    <Check size={16} /> Copied
                  </>
                ) : (
                  <>
                    <Copy size={16} /> Copy
                  </>
                )}
              </button>
            </div>
            <div className="whitespace-pre-wrap text-slate-100 mb-6">
              {prompt}
            </div>

            {/* AI Tool Buttons */}
            <div className="flex gap-3 pt-6 border-t border-slate-700">
              <button
                onClick={() => {
                  copyToClipboard();
                  window.open('https://claude.ai/new', '_blank');
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-sm"
              >
                Open in Claude
              </button>
              <button
                onClick={() => {
                  copyToClipboard();
                  window.open('https://chat.openai.com/', '_blank');
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-sm"
              >
                Open in ChatGPT
              </button>
            </div>
            <p className="text-slate-400 text-xs mt-3 text-center">Prompt copied! Paste in the opened tab.</p>
          </div>
        )}

        {/* Payment Gate */}
        {showPayment && (
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-slate-50 rounded-xl border border-blue-200 p-8 text-center">
            <p className="text-slate-900 font-semibold mb-4">Ready to unlock PlAInly?</p>
            <p className="text-slate-600 mb-6">One-time payment. Lifetime access. No subscriptions.</p>
            <a
              href="https://buy.stripe.com/14AcN52qR7BS4gSfqs5gc05"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Pay $8 • Get PlAInly Forever
            </a>
            <p className="text-xs text-slate-500 mt-4">Secure payment. One-time fee. Lifetime access.</p>
          </div>
        )}
      </section>

      {/* How It Works */}
      <section className="max-w-4xl mx-auto px-6 py-16 mt-8">
        <h3 className="text-2xl font-bold text-slate-900 mb-12 text-center">How it works</h3>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { num: '01', title: 'Describe your need', desc: 'Tell PlAInly what you\'re dealing with. No jargon needed.' },
            { num: '02', title: 'Get your prompt', desc: 'We translate it into a clear R-TACOS prompt you can copy.' },
            { num: '03', title: 'Paste & get results', desc: 'Use it in Claude, ChatGPT, or any AI tool. Actually useful output.' }
          ].map((item, idx) => (
            <div key={idx}>
              <p className="text-4xl font-bold text-slate-300 mb-3">{item.num}</p>
              <h4 className="font-semibold text-slate-900 mb-2">{item.title}</h4>
              <p className="text-slate-600 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h3 className="text-2xl font-bold text-slate-900 mb-8 text-center">Questions</h3>
        <div className="space-y-3">
          {faqItems.map((item, idx) => (
            <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                className="w-full px-6 py-4 flex justify-between items-center hover:bg-slate-50 transition-colors"
              >
                <p className="font-semibold text-slate-900">{item.q}</p>
                <ChevronDown
                  size={20}
                  className={`text-slate-600 transition-transform ${expandedFAQ === idx ? 'rotate-180' : ''}`}
                />
              </button>
              {expandedFAQ === idx && (
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                  <p className="text-slate-600 text-sm">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-16">
        <div className="max-w-4xl mx-auto px-6 py-8 text-center text-sm text-slate-500">
          <p>PlAInly · Translate your situation into an AI prompt that works</p>
        </div>
      </footer>

      <div className="h-8" />
    </div>
  );
}
