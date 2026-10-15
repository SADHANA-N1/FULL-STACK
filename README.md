# B2 - Shopping cart (React)

A `Cart` component that takes a `products` prop (`[{ id, name, price }]`), lets you add items, change quantities, remove lines, and shows the total with an automatic discount.

## Run it

```bash
npm install
npm run dev        # opens the demo at http://localhost:5173
npm test           # component tests
```

## Using the component

```jsx
import Cart from './src/Cart.jsx';

<Cart products={[{ id: 1, name: 'Notebook', price: 120 }]} />
```

## `data-testid` values

| Where | Test id |
|---|---|
| Add button, per product | `add-{id}` |
| Quantity text, per cart line | `qty-{id}` |
| Increase / decrease / remove, per line | `inc-{id}` / `dec-{id}` / `remove-{id}` |
| Empty message | `cart-empty` -> "Cart is empty" |
| Total | `total` -> "Total: 170.00" |
| Discount (only when it applies) | `discount` -> "Discount: 100.00" |
| Grand total (only when it applies) | `grand-total` -> "Grand Total: 900.00" |

## Discount rule

10% off when the total is 1000 or more. Both numbers sit at the top of `src/Cart.jsx`
(`DISCOUNT_THRESHOLD`, `DISCOUNT_RATE`) - if your question paper states a different rule, change them there.

The decrease button stops at 1; use Remove to take a line out.
