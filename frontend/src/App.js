return (
  <div style={layout}>

    {/* SIDEBAR */}
    <div style={sidebar}>
      <h2 style={{ color: "#60a5fa" }}>⚡ DevOps AI</h2>

      <button onClick={logout} style={logoutBtn}>
        Logout
      </button>

      <div style={{ marginTop: 20, fontSize: 13, opacity: 0.7 }}>
        AI Terraform Generator Platform
      </div>
    </div>

    {/* MAIN AREA */}
    <div style={main}>

      {/* HEADER */}
      <div style={header}>
        <h1>AI Terraform Generator</h1>
        <p>Generate • Edit • Save • Deploy Infrastructure</p>
      </div>

      {/* GRID */}
      <div style={grid}>

        {/* PROMPT CARD */}
        <div style={card}>
          <h3>💬 Prompt</h3>

          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Create VPC with 2 subnets in AWS"
            style={textarea}
          />

          <button onClick={generate} style={primaryBtn}>
            {loading ? "Generating..." : "Generate Terraform"}
          </button>
        </div>

        {/* GITHUB CARD */}
        <div style={card}>
          <h3>🔗 GitHub Connection</h3>

          <input
            placeholder="Repo name"
            value={repo}
            onChange={e => setRepo(e.target.value)}
            style={input}
          />

          <input
            placeholder="GitHub Token"
            value={githubToken}
            onChange={e => setGithubToken(e.target.value)}
            style={input}
          />

          <button onClick={saveToGitHub} style={successBtn}>
            Save to GitHub
          </button>
        </div>

      </div>

      {/* CODE EDITOR FULL WIDTH */}
      <div style={codeCard}>
        <div style={codeHeader}>
          <h3>🧾 Terraform Code</h3>
          <button onClick={copy} style={smallBtn}>Copy</button>
        </div>

        <textarea
          value={result}
          onChange={e => setResult(e.target.value)}
          style={codeEditor}
        />
      </div>

    </div>
  </div>
);