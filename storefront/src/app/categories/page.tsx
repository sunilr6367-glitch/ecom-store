import { permanentRedirect } from 'next/navigation';

export default function CategoriesIndexPage() {
  permanentRedirect('/collections');
}
