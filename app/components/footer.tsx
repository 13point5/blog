import Link from "next/link";

export function Footer() {
  return (
    <footer className="studio-footer studio-width">
      <div className="footer-top"><span className="footer-flower" aria-hidden="true">✳</span><p>“What I cannot create,<br /><em>I do not understand.</em>”<small>RICHARD FEYNMAN</small></p><div className="footer-links"><a href="https://x.com/27upon2">Twitter ↗</a><a href="https://github.com/13point5">GitHub ↗</a><a href="https://www.linkedin.com/in/13point5">LinkedIn ↗</a></div></div>
      <div className="footer-bottom"><Link href="/">Sriraam’s corner of the internet.</Link><span>Stay curious. Make things.</span><a href="#top">Back to top ↑</a></div>
    </footer>
  );
}
