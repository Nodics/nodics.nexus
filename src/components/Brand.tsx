export function Brand() {
  return (
    <a className="brand" href="/" aria-label="Nodics Nexus home">
      <svg className="brand-mark" aria-hidden="true" viewBox="0 0 64 64">
        <path
          d="M24 6H14l-4 4v14l-6 6v4l6 6v14l4 4h10M40 6h10l4 4v14l6 6v4l-6 6v14l-4 4H40"
          fill="none"
          stroke="currentColor"
          strokeLinecap="square"
          strokeLinejoin="miter"
          strokeWidth="4"
        />
        <text
          x="32"
          y="48"
          fill="#FFFFFF"
          fontFamily="Times New Roman, Times, serif"
          fontSize="45"
          fontWeight="400"
          textAnchor="middle"
          transform="translate(32 0) scale(.84 1) translate(-32 0)"
        >
          N
        </text>
      </svg>
      <span className="brand-lockup">
        <strong>NODICS</strong>
        <small>NEXUS</small>
      </span>
    </a>
  );
}
