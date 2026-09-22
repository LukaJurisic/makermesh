import {ArrowRight} from 'lucide-react';
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {Brand} from '@/components/brand/Logo';
import {AboutDemoDrawer} from '@/components/layout/AboutDemoDrawer';
import {useTrackProductEvent} from '@/app/useTrackProductEvent';
import '@/styles/site-refresh.css';

export function LandingPage() {
  useTrackProductEvent('landing_viewed');
  const [aboutOpen, setAboutOpen] = useState(false);
  return (
    <div className="maker-home">
      <header className="maker-home-nav">
        <Brand />
        <nav aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <Link to="/projects/harbour-coffee-lab/compare">See an example</Link>
        </nav>
        <Link to="/compose" className="home-nav-action">
          Start a request <ArrowRight size={16} />
        </Link>
      </header>
      <main>
        <section className="home-intro">
          <div className="home-intro-copy">
            <p className="home-category">Ceramics · Morocco</p>
            <h1>Find a workshop for your café’s next cups.</h1>
            <p className="home-lede">
              Describe what you want made, explore Moroccan workshops, and know what to ask before
              placing an order.
            </p>
            <div className="home-actions">
              <Link className="home-primary" to="/compose">
                Find a workshop <ArrowRight size={18} />
              </Link>
              <Link className="home-text-link" to="/projects/harbour-coffee-lab/compare">
                See a café order <ArrowRight size={16} />
              </Link>
            </div>
            <p className="home-small">
              Start with your own request, or try the example. No account needed.
            </p>
          </div>
          <figure className="home-photo">
            <img
              src="/images/maker-hands-hero.webp"
              alt="Illustration of a potter shaping a ceramic cup"
              fetchPriority="high"
            />
            <figcaption>
              <span>Made by hand. Made for daily use.</span>
            </figcaption>
          </figure>
        </section>
        <section id="how-it-works" className="home-process">
          <div className="home-process-intro">
            <p className="home-category">From idea to enquiry</p>
            <h2>
              Start with the cups.
              <br />
              Work through the details.
            </h2>
          </div>
          <ol>
            <li>
              <span>01</span>
              <div>
                <h3>Describe your order</h3>
                <p>
                  How many, which shape, what finish? Add your budget and where the order needs to
                  go.
                </p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Explore workshops</h3>
                <p>
                  Read what their websites say, open the original pages, and save the questions you
                  still need answered.
                </p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Make sense of a reply</h3>
                <p>
                  Try the café example to check a quote against an order and see what changes when
                  you need it sooner.
                </p>
              </div>
            </li>
          </ol>
        </section>
        <section className="home-order">
          <div className="home-order-image">
            <img
              src="/images/espresso-cup-study.webp"
              alt="Illustrative ceramic cups for the example café order"
              loading="lazy"
            />
          </div>
          <div className="home-order-copy">
            <p className="home-category">An order for Harbour Coffee Lab</p>
            <h2>
              200 cups.
              <br />A few things to work out.
            </h2>
            <p>
              The workshop quoted 72 MAD a cup and 30–35 days after sample approval. What if you
              need production finished in 30 days? Or want 400 cups instead?
            </p>
            <Link className="home-primary" to="/projects/harbour-coffee-lab/compare">
              Try the order <ArrowRight size={18} />
            </Link>
            <p className="home-small">
              Fictional café and workshop, using a reply from our test inbox.
            </p>
          </div>
        </section>
        <section className="home-finish">
          <div>
            <h2>What would you like made?</h2>
            <p>Cups, plates, bowls. Start with what you have in mind.</p>
          </div>
          <Link className="home-primary" to="/compose">
            Start your request <ArrowRight size={18} />
          </Link>
        </section>
      </main>
      <footer className="home-footer">
        <Brand />
        <p>A market appears when you ask.</p>
        <button onClick={() => setAboutOpen(true)}>About this project</button>
      </footer>
      <AboutDemoDrawer open={aboutOpen} onOpenChange={setAboutOpen} />
    </div>
  );
}
