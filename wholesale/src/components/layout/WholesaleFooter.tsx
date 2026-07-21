import Link from 'next/link';

export function WholesaleFooter() {
  return (
    <footer className="bg-[var(--ds-surface-dark)] text-[var(--ds-text-on-dark)] py-12">
      <div className="mx-auto grid max-w-[var(--ds-content-width)] grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="space-y-4">
          <h3 className="font-heading text-lg font-bold">ODHVICA WHOLESALE</h3>
          <p className="text-sm text-[var(--ds-text-on-dark)]/80">
            Premium handcrafted textiles and garments, available for bulk export worldwide.
          </p>
        </div>
        
        <div>
          <h4 className="font-medium mb-4">B2B Portal</h4>
          <ul className="space-y-2 text-sm text-[var(--ds-text-on-dark)]/80">
            <li><Link href="/products" className="hover:text-white transition-colors">Product Catalog</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Download PDF Catalog</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Buyer Login</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-medium mb-4">Support</h4>
          <ul className="space-y-2 text-sm text-[var(--ds-text-on-dark)]/80">
            <li><Link href="#" className="hover:text-white transition-colors">Wholesale Terms</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Shipping & MOQ</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Contact Us</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-medium mb-4">Contact</h4>
          <ul className="space-y-2 text-sm text-[var(--ds-text-on-dark)]/80">
            <li>export@odhvica.com</li>
            <li>+91 (800) 123-4567</li>
            <li>Jaipur, Rajasthan, India</li>
          </ul>
        </div>
      </div>
      
      <div className="mx-auto mt-12 max-w-[var(--ds-content-width)] border-t border-[var(--ds-text-on-dark)]/20 px-4 pt-8 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center text-xs text-[var(--ds-text-on-dark)]/60">
        <p>&copy; {new Date().getFullYear()} Odhvica Export. All rights reserved.</p>
        <p>B2B Channel</p>
      </div>
    </footer>
  );
}
