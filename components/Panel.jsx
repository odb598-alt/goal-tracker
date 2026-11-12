export default function Panel({ title, subtitle, right, children, className = '', id }) {
  return (
    <section className={'panel ' + className} id={id}>
      {(title || right) && (
        <div className="panel-head">
          <div>
            {title && <h2 className="panel-title">{title}</h2>}
            {subtitle && <p className="panel-sub">{subtitle}</p>}
          </div>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}