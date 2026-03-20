const integrations = [
  { name: "LinkedIn", logo: "https://framerusercontent.com/images/IUfB9QbjeigzvjL2oLTJ8HA3mls.png" },
  { name: "HubSpot", logo: "https://framerusercontent.com/images/8bd5ugDirBL7uvSlNwwiAypSGs.png" },
  { name: "Pipedrive", logo: "https://framerusercontent.com/images/Sj0aR7FEGpZX1JThxKfTyi2xPI.png" },
  { name: "Slack", logo: "https://framerusercontent.com/images/vOPjnWXz35bBeOJuZ9TMQaMKQ.png" },
  { name: "Zapier", logo: "https://framerusercontent.com/images/isHWJUW2oYREwJMFsK9tPiNfW6U.png" },
  { name: "Make", logo: "https://framerusercontent.com/images/i8txZqTVS9vRd0bhEd3hHOfF5RQ.jpeg" },
];

const Integrations = () => {
  return (
    <section id="integrations" className="py-24 px-4" style={{ background: "hsl(var(--muted))" }}>
      <div className="max-w-4xl mx-auto text-center">
        <span
          className="text-xs font-semibold uppercase tracking-widest mb-4 inline-block border rounded-full px-4 py-1.5"
          style={{
            color: "hsl(var(--goji-orange))",
            background: "hsl(var(--goji-orange) / 0.06)",
            borderColor: "hsl(var(--goji-orange) / 0.2)",
          }}
        >
          Integrations
        </span>
        <p className="text-sm font-medium text-goji-text-muted mb-3 mt-4">Connect with your tools</p>
        <h2 className="text-4xl md:text-5xl font-extrabold text-goji-dark tracking-tight leading-tight mb-4">
          Integrate with your best tools
        </h2>
        <p className="text-goji-text-muted text-base mb-14">
          Integrate Gojiberry with your stack in a few clicks to automate all your workflows.
        </p>

        {/* Integration logos grid */}
        <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mb-6">
          {integrations.map((int, i) => (
            <div
              key={i}
              className="bg-card rounded-2xl border border-border p-5 flex items-center justify-center aspect-square shadow-card hover:shadow-md transition-shadow hover:scale-105 transition-transform"
            >
              <img
                src={int.logo}
                alt={int.name}
                className="w-12 h-12 object-contain"
              />
            </div>
          ))}
          <div
            className="rounded-2xl border-2 border-dashed border-border p-5 flex items-center justify-center aspect-square"
          >
            <span className="text-2xl text-goji-text-muted">+</span>
          </div>
        </div>

        <p className="text-sm text-goji-text-muted">And many more integrations via API &amp; Zapier</p>
      </div>
    </section>
  );
};

export default Integrations;
