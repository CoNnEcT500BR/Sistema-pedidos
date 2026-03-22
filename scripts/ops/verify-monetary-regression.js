function toCents(value) {
  return Math.round(value * 100);
}

function fromCents(cents) {
  return cents / 100;
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function buildRandomOrder() {
  const itemsCount = Math.floor(random(1, 6));
  const items = [];

  for (let i = 0; i < itemsCount; i += 1) {
    const itemPrice = Number(random(3, 80).toFixed(2));
    const qty = Math.floor(random(1, 4));
    const addonsCount = Math.floor(random(0, 4));

    const addons = [];
    for (let j = 0; j < addonsCount; j += 1) {
      addons.push({
        addonPrice: Number(random(0, 12).toFixed(2)),
        qty: Math.floor(random(1, 3)),
      });
    }

    items.push({
      itemPrice,
      qty,
      addons,
    });
  }

  return items;
}

function calcFloat(items) {
  let total = 0;

  for (const item of items) {
    total += item.itemPrice * item.qty;
    for (const addon of item.addons) {
      total += addon.addonPrice * addon.qty;
    }
  }

  return Number(total.toFixed(2));
}

function calcCents(items) {
  let cents = 0;

  for (const item of items) {
    cents += toCents(item.itemPrice) * item.qty;
    for (const addon of item.addons) {
      cents += toCents(addon.addonPrice) * addon.qty;
    }
  }

  return fromCents(cents);
}

function main() {
  const totalCases = 1000;
  let maxDelta = 0;

  for (let i = 0; i < totalCases; i += 1) {
    const items = buildRandomOrder();
    const floatTotal = calcFloat(items);
    const centsTotal = calcCents(items);
    const delta = Math.abs(floatTotal - centsTotal);
    if (delta > maxDelta) {
      maxDelta = delta;
    }
  }

  const ok = maxDelta <= 0.01;

  console.log(
    JSON.stringify(
      {
        ok,
        totalCases,
        maxDelta,
        note: 'Comparacao float atual vs estrategia em centavos para totals sem desconto (estado atual do dominio)',
      },
      null,
      2,
    ),
  );

  if (!ok) {
    process.exit(1);
  }
}

main();
