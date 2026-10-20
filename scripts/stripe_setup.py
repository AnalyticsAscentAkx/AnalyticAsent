#!/usr/bin/env python3
"""Create the four products, prices and Payment Links in Stripe, once.

Run from the repo root. The key is a RESTRICTED Stripe key (Products, Prices
and Payment Links: write), read from STRIPE_KEY or, failing that, from
~/.secrets/stripe-aa.key (mode 600). It never goes on the command line, so it
stays out of shell history and logs.

    python3 scripts/stripe_setup.py --dry-run   # what it would create, no calls
    python3 scripts/stripe_setup.py             # create, or reuse what exists
    python3 scripts/stripe_setup.py --no-tax    # if Stripe Tax is not activated

It writes the four public Payment Link URLs to scripts/stripe_links.json and
prints them; they go in src/lib/pricing.ts as each package's `stripe` value.
Each link's confirmation page is https://analyticascent.com/thanks.
Idempotent: products are found by name, prices by amount, links by the
`package` metadata, so a re-run creates nothing new.
No dependency beyond the standard library.
"""
import json, os, pathlib, sys, urllib.error, urllib.parse, urllib.request

DRY = '--dry-run' in sys.argv
TAX = '--no-tax' not in sys.argv
API = 'https://api.stripe.com/v1/'
OUT = pathlib.Path(__file__).with_name('stripe_links.json')

def load_key():
    key = os.environ.get('STRIPE_KEY')
    f = pathlib.Path.home() / '.secrets' / 'stripe-aa.key'
    if not key and f.exists():
        key = f.read_text().strip()
    if not key:
        sys.exit('No key. Put a restricted key (Products, Prices, Payment Links: write) in ~/.secrets/stripe-aa.key or STRIPE_KEY.')
    if key.startswith('sk_'):
        sys.exit('That is a full secret key. Create a restricted key (rk_...) with only Products, Prices and Payment Links write.')
    return key

KEY = None if DRY else load_key()

def call(path, data=None, method=None):
    body = urllib.parse.urlencode(data, doseq=True).encode() if data is not None else None
    req = urllib.request.Request(API + path, data=body, method=method or ('POST' if body else 'GET'))
    req.add_header('Authorization', f'Bearer {KEY}')
    try:
        with urllib.request.urlopen(req) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        msg = json.load(e).get('error', {}).get('message', str(e))
        if 'tax' in msg.lower():
            msg += '\nStripe Tax looks inactive: activate it in the dashboard, or re-run with --no-tax.'
        sys.exit(f'Stripe refused {path.split("?")[0]}: {msg}')

PACKAGES = [
    ('check-solo',  'DORA pre-submission check (one entity)',  290000, None),
    ('check-group', 'DORA pre-submission check (group)',       690000, None),
    ('remediation', 'DORA register remediation: deposit',     250000, None),
    ('report',      'DORA quarterly concentration report',     240000, {'interval': 'month', 'interval_count': 3}),
]

if DRY:
    for pid, name, amount, recurring in PACKAGES:
        every = f" every {recurring['interval_count']} months" if recurring else ''
        print(f"{pid:12s} would create or reuse: {name}, EUR {amount / 100:,.2f}{every}, tax {'automatic' if TAX else 'off'}")
    sys.exit(0)

existing = {p['name']: p for p in call('products?limit=100&active=true')['data']}
links = {l['metadata'].get('package'): l for l in call('payment_links?limit=100&active=true')['data']}
out = {}
for pid, name, amount, recurring in PACKAGES:
    prod = existing.get(name) or call('products', {'name': name, 'metadata[package]': pid})
    price_data = {'product': prod['id'], 'unit_amount': amount, 'currency': 'eur', 'tax_behavior': 'exclusive'}
    if recurring:
        price_data.update({'recurring[interval]': recurring['interval'], 'recurring[interval_count]': recurring['interval_count']})
    prices = call(f"prices?product={prod['id']}&active=true")['data']
    price = next((p for p in prices if p['unit_amount'] == amount), None) or call('prices', price_data)
    link = links.get(pid)
    if not link:
        link_data = {
            'line_items[0][price]': price['id'],
            'line_items[0][quantity]': 1,
            'after_completion[type]': 'redirect',
            'after_completion[redirect][url]': 'https://analyticascent.com/thanks',
            'automatic_tax[enabled]': 'true' if TAX else 'false',
            'tax_id_collection[enabled]': 'true',
            'billing_address_collection': 'required',
            'metadata[package]': pid,
        }
        # Invoices are automatic for subscriptions; Stripe rejects the flag there.
        if not recurring:
            link_data['invoice_creation[enabled]'] = 'true'
        link = call('payment_links', link_data)
    out[pid] = link['url']
    print(f"{pid:12s} {link['url']}")
OUT.write_text(json.dumps(out, indent=2) + '\n')
print(f'\nWritten to {OUT}. Paste into src/lib/pricing.ts as the `stripe` value of each package.')
