export function SeoFaq() {
  return (
    <section className="faq-band">
      <div className="faq-inner">
        <h2>ヒンジ選定メモ</h2>
        <div className="faq-grid">
          <article>
            <h3>必要トルクの見方</h3>
            <p>重心の水平距離が大きい角度ほど、ヒンジ1個あたりの保持トルクが大きくなります。</p>
          </article>
          <article>
            <h3>保持余裕の目安</h3>
            <p>保持余裕率が1.1倍を下回る角度は、取付ばらつきや実荷重を含めた確認対象です。</p>
          </article>
          <article>
            <h3>操作力の調整</h3>
            <p>操作点をヒンジから遠ざけると、同じ操作トルクでも手元の力は小さくなります。</p>
          </article>
        </div>
      </div>
    </section>
  );
}
