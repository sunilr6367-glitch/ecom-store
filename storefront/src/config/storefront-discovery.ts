export const storefrontAttributeFilters = [
  {
    code: 'occasion',
    label: 'Occasion',
    values: [
      { value: 'wedding', label: 'Wedding' },
      { value: 'festive', label: 'Festive' },
      { value: 'gift', label: 'Gift' },
      { value: 'travel', label: 'Travel' },
      { value: 'shopping', label: 'Everyday Carry' },
    ],
  },
  {
    code: 'fabric',
    label: 'Material',
    values: [
      { value: 'cotton', label: 'Cotton' },
      { value: 'mulmul', label: 'Mulmul' },
      { value: 'silk', label: 'Silk' },
      { value: 'linen', label: 'Linen' },
      { value: 'khadi', label: 'Khadi' },
    ],
  },
  {
    code: 'color',
    label: 'Color',
    values: [
      { value: 'blue', label: 'Blue' },
      { value: 'green', label: 'Green' },
      { value: 'red', label: 'Red' },
      { value: 'white', label: 'White' },
      { value: 'yellow', label: 'Yellow' },
      { value: 'multicolor', label: 'Multicolor' },
    ],
  },
];

export const storefrontDiscoveryQuickLinks = [
  {
    label: 'Wedding edits',
    href: '/products?attribute_code=occasion&attribute_value=wedding',
  },
  {
    label: 'Festive picks',
    href: '/products?attribute_code=occasion&attribute_value=festive',
  },
  {
    label: 'Cotton styles',
    href: '/products?attribute_code=fabric&attribute_value=cotton',
  },
  {
    label: 'Blue tones',
    href: '/products?attribute_code=color&attribute_value=blue',
  },
];
