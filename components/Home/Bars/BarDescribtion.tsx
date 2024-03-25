function BarDescribtion({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="bar-desc-column">
      <div className="bar-name">{name}</div>
      <div className="bar-desc">{desc}</div>
    </div>
  );
}

export default BarDescribtion;
