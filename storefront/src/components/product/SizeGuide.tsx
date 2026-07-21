'use client';

import type { SizeGuide as SizeGuideType, SizeMeasurement } from '@/types';
import { Modal } from '@/design-system';

interface SizeGuideProps {
  isOpen: boolean;
  onClose: () => void;
  sizeGuide?: SizeGuideType | string;
}

export function SizeGuide({ isOpen, onClose, sizeGuide }: SizeGuideProps) {
  const renderCustomSizeChart = (guide: SizeGuideType) => {
    return (
      <div>
        <h3 className="font-body text-body-xs font-[var(--ds-type-strong-weight)] tracking-[var(--ds-type-label-tracking)] uppercase text-primary mb-4">
          {guide.type === 'clothing'
            ? 'Clothing'
            : guide.type === 'shoes'
              ? 'Shoes'
              : 'Accessories'}{' '}
          Size Chart
        </h3>
        <table className="w-full text-center font-body text-body-sm text-secondary">
          <thead className="bg-surface-paper border-b border-border-subtle">
            <tr>
              <th className="py-[var(--ds-space-xs)]">Size</th>
              {guide.measurements[0]?.chest && (
                <th className="py-[var(--ds-space-xs)]">Chest</th>
              )}
              {guide.measurements[0]?.waist && (
                <th className="py-[var(--ds-space-xs)]">Waist</th>
              )}
              {guide.measurements[0]?.hips && (
                <th className="py-[var(--ds-space-xs)]">Hips</th>
              )}
              {guide.measurements[0]?.length && (
                <th className="py-[var(--ds-space-xs)]">Length</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--ds-border-subtle)]">
            {guide.measurements.map((m: SizeMeasurement, i: number) => (
              <tr key={i}>
                <td className="py-[var(--ds-space-xs)]">{m.size}</td>
                {m.chest && <td>{m.chest}</td>}
                {m.waist && <td>{m.waist}</td>}
                {m.hips && <td>{m.hips}</td>}
                {m.length && <td>{m.length}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Size Guide"
      className="max-w-2xl"
      bodyClassName="p-8"
    >
        <p className="font-body text-body-sm font-body-weight leading-relaxed text-secondary mb-8 text-center">
          Measurements in inches
        </p>

        <div className="space-y-8">
          {/* Product-specific size chart — string or structured */}
          {sizeGuide && typeof sizeGuide === 'string' ? (
            <div className="prose prose-sm max-w-none mb-6 border-b border-border-subtle pb-6 text-[var(--kv-muted)]">
              <h3 className="font-body text-body-xs font-[var(--ds-type-strong-weight)] tracking-[var(--ds-type-label-tracking)] uppercase text-primary mb-4 text-[var(--kv-text)]">
                Product Size Guide
              </h3>
              <div dangerouslySetInnerHTML={{ __html: sizeGuide }} />
            </div>
          ) : sizeGuide && typeof sizeGuide === 'object' ? (
            renderCustomSizeChart(sizeGuide)
          ) : null}

          {/* Womenswear Size Chart */}
          <div>
            <h3 className="font-body text-body-xs font-[var(--ds-type-strong-weight)] tracking-[var(--ds-type-label-tracking)] uppercase text-primary mb-4">
              Womenswear
            </h3>
            <table className="w-full text-center font-body text-body-sm text-secondary">
              <thead className="bg-surface-paper border-b border-border-subtle">
                <tr>
                  <th className="py-[var(--ds-space-xs)]">Size</th>
                  <th className="py-[var(--ds-space-xs)]">US</th>
                  <th className="py-[var(--ds-space-xs)]">UK</th>
                  <th className="py-[var(--ds-space-xs)]">IT</th>
                  <th className="py-[var(--ds-space-xs)]">Bust (in)</th>
                  <th className="py-[var(--ds-space-xs)]">Waist (in)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ds-border-subtle)]">
                <tr>
                  <td className="py-[var(--ds-space-xs)]">XS</td>
                  <td>0-2</td>
                  <td>4-6</td>
                  <td>36-38</td>
                  <td>32-33</td>
                  <td>24-25</td>
                </tr>
                <tr>
                  <td className="py-[var(--ds-space-xs)]">S</td>
                  <td>4-6</td>
                  <td>8-10</td>
                  <td>40-42</td>
                  <td>34-35</td>
                  <td>26-27</td>
                </tr>
                <tr>
                  <td className="py-[var(--ds-space-xs)]">M</td>
                  <td>8-10</td>
                  <td>12-14</td>
                  <td>44-46</td>
                  <td>36-37</td>
                  <td>28-29</td>
                </tr>
                <tr>
                  <td className="py-[var(--ds-space-xs)]">L</td>
                  <td>12-14</td>
                  <td>16-18</td>
                  <td>48-50</td>
                  <td>38-40</td>
                  <td>30-32</td>
                </tr>
                <tr>
                  <td className="py-[var(--ds-space-xs)]">XL</td>
                  <td>16-18</td>
                  <td>20-22</td>
                  <td>52-54</td>
                  <td>42-44</td>
                  <td>34-36</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Menswear Size Chart */}
          <div>
            <h3 className="font-body text-body-xs font-[var(--ds-type-strong-weight)] tracking-[var(--ds-type-label-tracking)] uppercase text-primary mb-4">
              Menswear
            </h3>
            <table className="w-full text-center font-body text-body-sm text-secondary">
              <thead className="bg-surface-paper border-b border-border-subtle">
                <tr>
                  <th className="py-[var(--ds-space-xs)]">Size</th>
                  <th className="py-[var(--ds-space-xs)]">US</th>
                  <th className="py-[var(--ds-space-xs)]">UK</th>
                  <th className="py-[var(--ds-space-xs)]">IT</th>
                  <th className="py-[var(--ds-space-xs)]">Chest (in)</th>
                  <th className="py-[var(--ds-space-xs)]">Waist (in)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ds-border-subtle)]">
                <tr>
                  <td className="py-[var(--ds-space-xs)]">S</td>
                  <td>34-36</td>
                  <td>34-36</td>
                  <td>44-46</td>
                  <td>34-36</td>
                  <td>28-30</td>
                </tr>
                <tr>
                  <td className="py-[var(--ds-space-xs)]">M</td>
                  <td>38-40</td>
                  <td>38-40</td>
                  <td>48-50</td>
                  <td>38-40</td>
                  <td>32-34</td>
                </tr>
                <tr>
                  <td className="py-[var(--ds-space-xs)]">L</td>
                  <td>42-44</td>
                  <td>42-44</td>
                  <td>52-54</td>
                  <td>42-44</td>
                  <td>36-38</td>
                </tr>
                <tr>
                  <td className="py-[var(--ds-space-xs)]">XL</td>
                  <td>46-48</td>
                  <td>46-48</td>
                  <td>56-58</td>
                  <td>46-48</td>
                  <td>40-42</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* How to Measure */}
          <div className="bg-parchment p-6">
            <h3 className="font-display text-display-sm font-[var(--ds-type-ui-weight)] text-primary mb-4">How to Measure</h3>
            <div className="font-body text-body-sm font-body-weight leading-relaxed text-secondary grid gap-[var(--ds-space-sm)] md:grid-cols-3">
              <div>
                <p className="font-body text-body-sm font-[var(--ds-type-strong-weight)] text-primary mb-1">Bust</p>
                <p>
                  Measure around the fullest part of your bust, keeping the tape
                  horizontal.
                </p>
              </div>
              <div>
                <p className="font-body text-body-sm font-[var(--ds-type-strong-weight)] text-primary mb-1">Waist</p>
                <p>
                  Measure around your natural waistline, keeping the tape
                  comfortably loose.
                </p>
              </div>
              <div>
                <p className="font-body text-body-sm font-[var(--ds-type-strong-weight)] text-primary mb-1">Hip</p>
                <p>
                  Measure around the fullest part of your hips, about 8&quot;
                  below your waistline.
                </p>
              </div>
            </div>
          </div>

          {/* Fit Advice */}
          <div className="bg-parchment p-6">
            <h3 className="font-display text-display-sm font-[var(--ds-type-ui-weight)] text-primary mb-2">Fit Advice</h3>
            <p className="font-body text-body-sm font-body-weight leading-relaxed text-secondary">
              Our garments are cut for a relaxed, contemporary fit. If you are
              between sizes, we recommend sizing down for a closer fit or sizing
              up for a more oversized silhouette. For detailed measurements of a
              specific item, please contact support@odhvica.com or use the
              chat widget.
            </p>
          </div>
        </div>
    </Modal>
  );
}

