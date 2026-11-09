import type { Product } from '@/shared/api/types';
import { formatQuantity } from '@/shared/format/units';
import { messages } from '@/shared/i18n/messages';

const t = messages.shoppingList;

type Input = {
  businessName?: string;
  outOfStock: Product[];
  lowStock: Product[];
  date: Date;
};

const dateFormat = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long' });

// Texto de lo que hay que surtir, para compartirlo por WhatsApp u otra app.
export function buildShoppingList({ businessName, outOfStock, lowStock, date }: Input): string {
  const section = (title: string, products: Product[], line: (product: Product) => string) =>
    products.length > 0 ? [`*${title} (${products.length})*`, ...products.map(line), ''] : [];

  const minimum = (product: Product) =>
    product.minStock === null ? '' : ` · ${t.minimum(formatQuantity(product.minStock, product.unit))}`;

  return [
    `*${businessName ? t.titleWithBusiness(businessName) : t.title}*`,
    dateFormat.format(date),
    '',
    ...section(t.outOfStock, outOfStock, (product) => `• ${product.name}${minimum(product)}`),
    ...section(
      t.lowStock,
      lowStock,
      (product) => `• ${product.name}: ${t.remaining(formatQuantity(product.stock, product.unit))}${minimum(product)}`,
    ),
  ]
    .join('\n')
    .trim();
}
