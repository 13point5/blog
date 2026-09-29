import Image from "next/image";
import Link from "next/link";

export const metadata = { title: "About", description: "Sriraam — applied researcher working on reinforcement learning and how machines learn." };

export default function AboutPage() {
  return (
    <div className="article-page about-page">
      <Link className="back-link" href="/">← Collection</Link>
      <header className="about-page-header">
        <Image src="/avatar.jpeg" alt="Illustrated portrait of Sriraam" width={112} height={112} priority />
        <div><h1>Hey, I’m Sriraam.</h1><p>Researcher, builder, always learning.</p></div>
      </header>
      <div className="article-body">
        <p>I’m an Applied Researcher on the post-training team at <a className="link-default" href="https://www.chakra.dev/">Chakra Labs</a>. I build reinforcement learning environments, training tasks, and internal benchmarks focused on knowledge work for foundation labs.</p>
        <h2>What I’m thinking about</h2>
        <p>How can a model learn more from each experience? How do we evaluate a long sequence of decisions? And what can human learning tell us about building better learning systems?</p>
        <ul className="about-interests"><li>Sample efficiency and continual learning</li><li>World models and neural RL environments</li><li>Human simulation and adaptive reasoning</li><li>Mechanistic interpretability and reinforcement learning</li><li>Evaluation, verification, and sycophancy</li></ul>
        <h2>Learning, in both senses</h2>
        <p>I studied Learning Design, Innovation, and Technology at the Harvard Graduate School of Education. Learning science has made me see almost every problem as a learning problem. I draw on that perspective in my reinforcement learning work.</p>
        <p>Away from the experiments: Hogwarts, anime, and K-dramas.</p>
        <h2>Say hello</h2>
        <p>If any of these questions interest you, I’d love to talk.</p>
        <div className="about-links"><a href="https://x.com/27upon2">Twitter ↗</a><a href="https://github.com/13point5">GitHub ↗</a><a href="https://www.linkedin.com/in/13point5">LinkedIn ↗</a></div>
      </div>
      <div className="article-end"><Link href="/">← Back to the collection</Link></div>
    </div>
  );
}
