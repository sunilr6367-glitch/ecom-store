-- ── LEGAL PAGES — Real content for Odhvica ──────────────────────────────
-- Run on VPS: docker compose exec -T postgres psql -U odhvica -d odhvica < seed-legal-pages.sql

-- ── PRIVACY POLICY ────────────────────────────────────────────────────────
UPDATE pages SET content = $CONTENT$
<h1>Privacy Policy</h1>
<p><strong>Effective Date:</strong> 1 April 2025 &nbsp;|&nbsp; <strong>Last Updated:</strong> 21 April 2025</p>

<p>Odhvica ("we", "our", "us") is committed to protecting your personal information. This Privacy Policy explains what data we collect, how we use it, and your rights when you shop on <strong>odhvica.com</strong>.</p>

<h2>1. Information We Collect</h2>
<ul>
  <li><strong>Account information:</strong> Name, email address, phone number, and password (stored encrypted).</li>
  <li><strong>Order information:</strong> Shipping address, billing address, and payment method details. We do not store full card numbers — payments are processed by Razorpay and PayPal.</li>
  <li><strong>Usage data:</strong> Pages visited, products viewed, browser type, IP address, and device information.</li>
  <li><strong>Communications:</strong> Messages you send via our contact form, email, or WhatsApp.</li>
</ul>

<h2>2. How We Use Your Information</h2>
<ul>
  <li>To process and ship your orders</li>
  <li>To send order confirmations, shipping updates, and invoices</li>
  <li>To respond to your queries and support requests</li>
  <li>To send you promotional emails and offers (only if you opt in)</li>
  <li>To improve our website, products, and services</li>
  <li>To comply with applicable laws in India</li>
</ul>

<h2>3. Sharing of Information</h2>
<p>We do not sell or rent your personal data. We share information only with:</p>
<ul>
  <li><strong>Shipping partners</strong> (e.g., Shiprocket, India Post, FedEx) to deliver your order</li>
  <li><strong>Payment gateways</strong> (Razorpay, PayPal) to process payments securely</li>
  <li><strong>Legal authorities</strong> when required by law or court order</li>
</ul>

<h2>4. Cookies</h2>
<p>We use cookies to keep you logged in, remember your cart, and understand how visitors use our site. You may disable cookies in your browser settings, but this may affect checkout functionality.</p>

<h2>5. Data Retention</h2>
<p>We retain your account and order data for 7 years as required under Indian tax law (GST records). You may request deletion of your account at any time by emailing <strong>support@odhvica.com</strong>; order records required for legal compliance will be retained.</p>

<h2>6. Security</h2>
<p>We use HTTPS encryption, secure password hashing, and industry-standard security practices. However, no internet transmission is 100% secure — please keep your account password confidential.</p>

<h2>7. Your Rights</h2>
<p>You have the right to access, correct, or delete your personal data. Email us at <strong>support@odhvica.com</strong> with your request and we will respond within 7 business days.</p>

<h2>8. Children's Privacy</h2>
<p>Our services are not directed at children under 13. We do not knowingly collect data from children.</p>

<h2>9. Changes to This Policy</h2>
<p>We may update this policy from time to time. The "Last Updated" date at the top reflects the most recent revision. Continued use of our site after changes means you accept the updated policy.</p>

<h2>10. Contact</h2>
<p>For any privacy-related concerns, write to us at:<br>
<strong>Email:</strong> support@odhvica.com<br>
<strong>Address:</strong> Odhvica, Jaipur, Rajasthan – 302001, India</p>
$CONTENT$, updated_at = now() WHERE slug = 'privacy-policy';

-- ── TERMS OF SERVICE ──────────────────────────────────────────────────────
UPDATE pages SET content = $CONTENT$
<h1>Terms of Service</h1>
<p><strong>Effective Date:</strong> 1 April 2025 &nbsp;|&nbsp; <strong>Last Updated:</strong> 21 April 2025</p>

<p>Welcome to Odhvica. By accessing or purchasing from <strong>odhvica.com</strong>, you agree to these Terms of Service. Please read them carefully.</p>

<h2>1. About Odhvica</h2>
<p>Odhvica is a Jaipur-based brand selling handcrafted Indian ethnic wear — including Kantha sarees, suits, lehengas, dupattas, and accessories — made by skilled artisans across Rajasthan and West Bengal.</p>

<h2>2. Products & Descriptions</h2>
<p>Every Odhvica product is handcrafted. Slight variations in colour, texture, embroidery, and dimensions are inherent to handmade items and are not defects. Product photographs are taken in natural light and are as accurate as possible, but actual colours may vary slightly on different screens.</p>

<h2>3. Ordering</h2>
<ul>
  <li>You must be 18 years or older to place an order.</li>
  <li>All prices are listed in Indian Rupees (INR) and include GST where applicable.</li>
  <li>An order is confirmed only after payment is successfully received and you receive a confirmation email.</li>
  <li>We reserve the right to cancel any order due to stock availability, pricing errors, or suspected fraud. A full refund will be issued immediately in such cases.</li>
</ul>

<h2>4. Payments</h2>
<p>We accept UPI, credit/debit cards, net banking, and wallets via Razorpay (India), and international cards via PayPal. All transactions are encrypted and secure. Odhvica does not store card details.</p>

<h2>5. Intellectual Property</h2>
<p>All content on this website — including product photographs, descriptions, logo, and design — is owned by Odhvica. You may not copy, reproduce, or use our content without written permission.</p>

<h2>6. Limitation of Liability</h2>
<p>Odhvica is not liable for delays caused by courier services, customs clearance, natural disasters, or other events beyond our control. Our total liability to you shall not exceed the amount paid for the specific order in question.</p>

<h2>7. Governing Law</h2>
<p>These Terms are governed by the laws of India. Any disputes will be subject to the exclusive jurisdiction of the courts in Jaipur, Rajasthan.</p>

<h2>8. Changes to Terms</h2>
<p>We may update these Terms from time to time. The "Last Updated" date at the top reflects the most recent revision. Continued use of our website means you accept the updated Terms.</p>

<h2>9. Contact</h2>
<p><strong>Email:</strong> support@odhvica.com<br>
<strong>Address:</strong> Odhvica, Jaipur, Rajasthan – 302001, India</p>
$CONTENT$, updated_at = now() WHERE slug = 'terms-of-service';

-- ── SHIPPING & RETURNS ────────────────────────────────────────────────────
UPDATE pages SET content = $CONTENT$
<h1>Shipping &amp; Returns</h1>
<p><strong>Last Updated:</strong> 21 April 2025</p>

<h2>Shipping Policy</h2>

<h3>Processing Time</h3>
<p>All Odhvica products are handcrafted and made with care. Orders are dispatched within <strong>2–5 business days</strong> of payment confirmation. During peak seasons (festive sales, Diwali, Navratri), processing may take up to 7 business days.</p>

<h3>Shipping Within India</h3>
<table>
  <thead><tr><th>Order Value</th><th>Shipping Charge</th><th>Estimated Delivery</th></tr></thead>
  <tbody>
    <tr><td>Below ₹999</td><td>₹99</td><td>5–8 business days</td></tr>
    <tr><td>₹999 and above</td><td><strong>FREE</strong></td><td>5–8 business days</td></tr>
  </tbody>
</table>

<h3>International Shipping</h3>
<p>We ship worldwide. International orders carry a flat shipping fee of <strong>₹499</strong> (approx. USD 6). Delivery typically takes <strong>10–21 business days</strong> depending on destination and customs clearance. Customers are responsible for any import duties, customs fees, or local taxes applicable in their country.</p>

<h3>Order Tracking</h3>
<p>Once your order is dispatched, you will receive a tracking number via email and SMS. You can track your order on the <a href="/track">Track Order</a> page or directly on the courier partner's website.</p>

<h2>Returns &amp; Exchanges</h2>

<h3>Our Promise</h3>
<p>We take pride in every handcrafted piece we send you. If something is wrong, we will make it right.</p>

<h3>Return Eligibility</h3>
<ul>
  <li>Returns are accepted within <strong>7 days</strong> of delivery for items that are defective, damaged, or incorrectly sent.</li>
  <li>Items must be unused, unwashed, and in their original packaging with tags intact.</li>
  <li>Sale items and custom/made-to-order products are <strong>not eligible</strong> for return.</li>
  <li>Minor colour variations due to the handcrafted nature of our products are not considered defects.</li>
</ul>

<h3>How to Raise a Return Request</h3>
<ol>
  <li>Email <strong>support@odhvica.com</strong> within 7 days of delivery with your order number and photographs of the issue.</li>
  <li>Our team will review your request within 2 business days.</li>
  <li>If approved, we will arrange a reverse pickup (India only) or provide return shipping instructions.</li>
</ol>

<h3>Refunds</h3>
<p>Once we receive and inspect the returned item, a refund will be processed to your original payment method within <strong>5–7 business days</strong>. For UPI/bank transfers, it may take an additional 2–3 days to reflect in your account.</p>

<h3>Exchanges</h3>
<p>We offer exchanges for size or colour (subject to availability). To request an exchange, email us at <strong>support@odhvica.com</strong> within 7 days of delivery.</p>

<h3>Cancellations</h3>
<p>Orders can be cancelled within <strong>24 hours</strong> of placement by emailing us at support@odhvica.com. Once an order has been dispatched, it cannot be cancelled.</p>

<h2>Contact Us</h2>
<p><strong>Email:</strong> support@odhvica.com<br>
<strong>WhatsApp:</strong> +91 98765 43210<br>
<strong>Address:</strong> Odhvica, Jaipur, Rajasthan – 302001, India</p>
$CONTENT$, updated_at = now() WHERE slug = 'shipping-returns';

-- Also update the separate policy pages with the same content (for SEO)
UPDATE pages SET content = $CONTENT$
<h1>Refund &amp; Cancellation Policy</h1>
<p><strong>Last Updated:</strong> 21 April 2025</p>

<h2>Returns</h2>
<p>Returns are accepted within <strong>7 days</strong> of delivery for defective, damaged, or incorrectly shipped items. Items must be unused, unwashed, and in original packaging with tags intact. Sale items and custom/made-to-order pieces are non-returnable.</p>
<p>To initiate a return: email <strong>support@odhvica.com</strong> with your order number and photos of the issue within 7 days of delivery. Our team will respond within 2 business days.</p>

<h2>Refunds</h2>
<p>After we receive and inspect your return, refunds are processed to your original payment method within <strong>5–7 business days</strong>. UPI/bank refunds may take 2–3 additional business days to reflect.</p>

<h2>Exchanges</h2>
<p>Size or colour exchanges are accepted within 7 days of delivery (subject to availability). Email us at support@odhvica.com to request an exchange.</p>

<h2>Cancellations</h2>
<p>You may cancel your order within <strong>24 hours</strong> of placing it by emailing support@odhvica.com. Orders already dispatched cannot be cancelled — you may initiate a return after delivery.</p>

<h2>Contact</h2>
<p><strong>Email:</strong> support@odhvica.com &nbsp;|&nbsp; <strong>WhatsApp:</strong> +91 98765 43210</p>
$CONTENT$, updated_at = now() WHERE slug = 'refund-cancellation-policy';

UPDATE pages SET content = $CONTENT$
<h1>Shipping Policy</h1>
<p><strong>Last Updated:</strong> 21 April 2025</p>

<h2>Processing Time</h2>
<p>Orders are dispatched within <strong>2–5 business days</strong> of payment confirmation. During festive seasons, processing may take up to 7 business days.</p>

<h2>Domestic Shipping (India)</h2>
<table>
  <thead><tr><th>Order Value</th><th>Shipping Charge</th><th>Delivery Time</th></tr></thead>
  <tbody>
    <tr><td>Below ₹999</td><td>₹99</td><td>5–8 business days</td></tr>
    <tr><td>₹999 and above</td><td><strong>FREE</strong></td><td>5–8 business days</td></tr>
  </tbody>
</table>

<h2>International Shipping</h2>
<p>Flat shipping fee of <strong>₹499</strong> for all international orders. Delivery takes 10–21 business days. Import duties and customs fees are the responsibility of the buyer.</p>

<h2>Order Tracking</h2>
<p>A tracking number is sent to your email and phone once your order is dispatched. Track your order at <a href="/track">odhvica.com/track</a>.</p>

<h2>Contact</h2>
<p><strong>Email:</strong> support@odhvica.com &nbsp;|&nbsp; <strong>WhatsApp:</strong> +91 98765 43210</p>
$CONTENT$, updated_at = now() WHERE slug = 'shipping-policy';

-- ── SIZE GUIDE (new page) ─────────────────────────────────────────────────
INSERT INTO pages (id,title,slug,content,is_visible,created_at,updated_at)
VALUES (gen_random_uuid(),'Size Guide','size-guide',$CONTENT$
<h1>Size Guide</h1>
<p>Our garments are handcrafted with care. Please refer to this guide before ordering to ensure the best fit. If you need help, email us at <strong>support@odhvica.com</strong>.</p>

<h2>How to Measure</h2>
<ul>
  <li><strong>Chest/Bust:</strong> Measure around the fullest part of your chest, keeping the tape parallel to the ground.</li>
  <li><strong>Waist:</strong> Measure around your natural waistline (the narrowest part of your torso).</li>
  <li><strong>Hips:</strong> Measure around the fullest part of your hips, about 20 cm below your waist.</li>
  <li><strong>Length:</strong> Measure from the top of your shoulder straight down to where you want the garment to end.</li>
</ul>

<h2>Kurti / Suit Sizing (Women)</h2>
<table>
  <thead><tr><th>Size</th><th>Chest (inches)</th><th>Waist (inches)</th><th>Hip (inches)</th></tr></thead>
  <tbody>
    <tr><td>XS</td><td>32</td><td>26</td><td>36</td></tr>
    <tr><td>S</td><td>34</td><td>28</td><td>38</td></tr>
    <tr><td>M</td><td>36</td><td>30</td><td>40</td></tr>
    <tr><td>L</td><td>38</td><td>32</td><td>42</td></tr>
    <tr><td>XL</td><td>40</td><td>34</td><td>44</td></tr>
    <tr><td>2XL</td><td>42</td><td>36</td><td>46</td></tr>
    <tr><td>3XL</td><td>44</td><td>38</td><td>48</td></tr>
  </tbody>
</table>

<h2>Lehenga / Skirt Sizing</h2>
<table>
  <thead><tr><th>Size</th><th>Waist (inches)</th><th>Hip (inches)</th><th>Length (inches)</th></tr></thead>
  <tbody>
    <tr><td>S</td><td>26–28</td><td>36–38</td><td>40</td></tr>
    <tr><td>M</td><td>30–32</td><td>40–42</td><td>41</td></tr>
    <tr><td>L</td><td>34–36</td><td>44–46</td><td>42</td></tr>
    <tr><td>XL</td><td>38–40</td><td>48–50</td><td>43</td></tr>
    <tr><td>2XL</td><td>42–44</td><td>52–54</td><td>44</td></tr>
  </tbody>
</table>

<h2>Saree Blouse Sizing</h2>
<table>
  <thead><tr><th>Size</th><th>Chest (inches)</th><th>Waist (inches)</th></tr></thead>
  <tbody>
    <tr><td>32</td><td>32</td><td>28</td></tr>
    <tr><td>34</td><td>34</td><td>30</td></tr>
    <tr><td>36</td><td>36</td><td>32</td></tr>
    <tr><td>38</td><td>38</td><td>34</td></tr>
    <tr><td>40</td><td>40</td><td>36</td></tr>
    <tr><td>42</td><td>42</td><td>38</td></tr>
  </tbody>
</table>

<h2>Dupatta / Stole</h2>
<p>Dupattas are available in standard dimensions of approximately <strong>100 cm × 200 cm</strong> unless specified otherwise on the product page. Sarees are 5.5 metres including the blouse piece unless stated differently.</p>

<h2>Custom Sizing</h2>
<p>We offer custom sizing for select products. If you need a specific size or have special measurements, please email us at <strong>support@odhvica.com</strong> before placing your order. Custom orders may take an additional 5–7 business days.</p>

<p><em>All measurements are approximate. For any sizing questions, contact us at support@odhvica.com — we're happy to help!</em></p>
$CONTENT$,true,now(),now())
ON CONFLICT (slug) DO NOTHING;

-- ── SHIPPING & RETURNS (ensure it exists) ────────────────────────────────
INSERT INTO pages (id,title,slug,content,is_visible,created_at,updated_at)
VALUES (gen_random_uuid(),'Shipping & Returns','shipping-returns',$CONTENT$
<h1>Shipping &amp; Returns</h1><p>See our full policy above.</p>
$CONTENT$,true,now(),now())
ON CONFLICT (slug) DO NOTHING;

-- Verify
SELECT slug, LEFT(content,60) as preview FROM pages ORDER BY created_at;
