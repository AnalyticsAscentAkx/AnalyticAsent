#!/usr/bin/env python3
"""Create the four products, prices and Payment Links in Stripe, once.

Run from the repo root with a RESTRICTED Stripe key (Products, Prices and
Payment Links: write) in the environment:

    STRIPE_KEY=rk_live_... python3 scripts/stripe_setup.py

It prints the four Payment Link URLs to paste into src/lib/pricing.ts and
sets each link's confirmation page to https://analyticascent.com/thanks.
Idempotent: re-running finds existing products by name and reuses them.
No dependency beyond the standard library.
"""
import json, os, sys, urllib.parse, urllib.request

KEY = os.environ.get('STRIPE_KEY')
if not KEY:
    sys.exit('Set STRIPE_KEY (a restricted key with Products, Prices, Payment Links write).')
API = 'https://api.stripe.com/v1/'

def call(path, data=None, method=None):
    body = urllib.parse.urlencode(data, doseq=True).encode() if data is not None else None
    req = urllib.request.Request(API + path, data=body, method=method or ('POST' if body else 'GET'))
    req.add_header('Authorization', f'Bearer {KEY}')
    with urllib.request.urlopen(req) as r:
        return json.load(r)

PACKAGES = [
    ('check-solo',  'DORA pre-submission check (one entity)',  290000, None),
    ('check-group', 'DORA pre-submission check (group)',       690000, None),
    ('remediation', 'DORA register remediation — deposit',     250000, None),
    ('report',      'DORA quarterly concentration report',     240000, {'interval': 'month', 'interval_count': 3}),
]

existing = {p['name']: p for p in call('products?limit=100&active=true')['data']}
out = {}
for pid, name, amount, recurring in PACKAGES:
    prod = existing.get(name) or call('products', {'name': name, 'metadata[package]': pid})
    price_data = {'product': prod['id'], 'unit_amount': amount, 'currency': 'eur', 'tax_behavior': 'exclusive'}
    if recurring:
        price_data.update({'recurring[interval]': recurring['interval'], 'recurring[interval_count]': recurring['interval_count']})
    prices = call(f"prices?product={prod['id']}&active=true")['data']
    price = next((p for p in prices if p['unit_amount'] == amount), None) or call('prices', price_data)
    link = call('payment_links', {
        'line_items[0][price]': price['id'],
        'line_items[0][quantity]': 1,
        'after_completion[type]': 'redirect',
        'after_completion[redirect][url]': 'https://analyticascent.com/thanks',
        'automatic_tax[enabled]': 'true',
        'tax_id_collection[enabled]': 'true',
        'billing_address_collection': 'required',
        'invoice_creation[enabled]': 'false' if recurring else 'true',
        'metadata[package]': pid,
    })
    out[pid] = link['url']
    print(f"{pid:12s} {link['url']}")
print('\nPaste into src/lib/pricing.ts as the `stripe` value of each package.')
