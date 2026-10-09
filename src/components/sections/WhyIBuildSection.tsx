"use client";

import React, { useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight } from "lucide-react";
import HeadingReveal from "@/components/ui/HeadingReveal";
import ButtonWithIcon from "@/components/ui/button-with-icon";
import JpTerm from "@/components/ui/jp-term";
import { TextRoll } from "@/components/ui/TextRoll";
import { usePageTransition } from "@/components/ui/TransitionProvider";
import { projectPath } from "@/data/projects";
import { useActivate, queueScrollRefresh } from "@/components/ui/use-activate";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const STATEMENT =
  "I learn by building. Every project this year taught me something the last one couldn't, and each one made me care more about the people on the other side of the screen.";

/** The year so far, one build at a time (dates match src/data/project-details.ts) */
const BEATS: {
  when: string;
  span?: string;
  title: string;
  text: string;
  project?: { slug: string; name: string };
}[] = [
  {
    when: "Jan",
    span: "4 weeks",
    title: "Took apart the app everyone scrolls",
    text: "I rebuilt the Facebook feed pixel by pixel to see how something that big holds together. Most of it, it turns out, is small decisions nobody notices.",
    project: { slug: "facebook-clone", name: "Facebook Clone" },
  },
  {
    when: "Feb",
    span: "3 weeks",
    title: "Made my résumé worth reading",
    text: "If I'm asking someone for two minutes, the least I can do is make them count: themes, palettes, and a PDF that matches the screen.",
    project: { slug: "interactive-cv", name: "Interactive CV" },
  },
  {
    when: "Feb – Mar",
    span: "5 weeks",
    title: "Learned what a personal site is for",
    text: "My first portfolio, with a friendly 3D robot at the door. It taught me that a site about you should feel like meeting you, not reading a list.",
    project: { slug: "mab-portfolio", name: "MAB Portfolio" },
  },
  {
    when: "Apr – May",
    span: "7 weeks",
    title: "Built around someone else's idea",
    text: "A studio site shaped around one line: development that you need, indeed. Listening turned out to be half the job.",
    project: { slug: "hra-studio", name: "HRA Studio" },
  },
  {
    when: "May – Aug",
    span: "12 weeks",
    title: "Twelve weeks for a Dubai developer",
    text: "My biggest build yet: property listings that sell the skyline, and the dashboard that runs them. Real users, real deadlines, no shortcuts.",
    project: { slug: "ard-al-khair", name: "Ard Al Khair" },
  },
  {
    when: "Jun – Aug",
    span: "Evenings",
    title: "The site you're on",
    text: "Built in the evenings, alongside client work. Every section here is something I wanted to try and finally had a reason to.",
    project: { slug: "story-portfolio", name: "This portfolio" },
  },
  {
    when: "Now",
    title: "Your project",
    text: "Based in Pakistan, working with clients around the world. This list has room for one more.",
  },
];

const PROMISES = [
  {
    title: "Straight answers",
    text: "If something won't work, or will cost more than it's worth, you'll hear it from me early.",
  },
  {
    title: "Progress you can see",
    text: "A live link from the first week, updated as we go. You never have to ask where things are.",
  },
  {
    title: "Work that lasts",
    text: "Fast pages, clean code and a handover you can use long after launch.",
  },
];

/**
 * Why I build: the human part of the home page. A statement that lights up
 * word by word as it scrolls past, then the year told through the projects
 * (a line draws down the beats while the month beside them turns over),
 * ending on an open slot for the visitor's project, then three promises.
 */
export function WhyIBuildSection() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const { transitionTo } = usePageTransition();

  const sceneOn = useActivate(root, "200% 0px");
  useGSAP(
    () => {
      // Set up only once the visitor nears the section (see use-activate.ts)
      if (!sceneOn) return;
      queueScrollRefresh();
      const el = root.current;
      if (!el) return;
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // The statement: each word goes from faint to full as it scrolls through.
        // Faint is 0.4, the lowest that still reads at 3:1 contrast as large text.
        gsap.fromTo(
          el.querySelectorAll(".wb-statement__w"),
          { opacity: 0.4 },
          {
            opacity: 1,
            ease: "none",
            stagger: 0.1,
            scrollTrigger: {
              trigger: ".wb-statement",
              start: "top 82%",
              end: "bottom 50%",
              scrub: 0.6,
            },
          },
        );

        // The line down the beats fills as the reader moves through the year
        gsap.fromTo(
          ".wb-beats__fill",
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: {
              trigger: ".wb-beats",
              start: "top 55%",
              end: "bottom 55%",
              scrub: 0.4,
            },
          },
        );

        // Each beat eases in as it arrives
        gsap.utils.toArray<HTMLElement>(".wb-beat__body").forEach((b) => {
          gsap.from(b, {
            y: 28,
            opacity: 0,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { trigger: b, start: "top 85%", once: true },
          });
        });

        gsap.from(".wb-promise", {
          y: 24,
          opacity: 0,
          duration: 0.9,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".wb-promises",
            start: "top 85%",
            once: true,
          },
        });
      });

      // Which beat is being read (it drives the month beside them and the
      // dots): the last one whose dot the line has reached. Same range as the
      // line, so the two never disagree; beat offsets are measured on refresh
      // only, not while scrolling.
      const list = el.querySelector<HTMLElement>(".wb-beats");
      const beats = gsap.utils.toArray<HTMLElement>(".wb-beat");
      let offsets: number[] = [];
      let span = 1;
      const pick = (progress: number) => {
        const y = progress * span;
        let i = 0;
        offsets.forEach((o, k) => o <= y + 1 && (i = k));
        setActive(i);
      };
      if (list) {
        ScrollTrigger.create({
          trigger: list,
          start: "top 55%",
          end: "bottom 55%",
          onRefresh: (self) => {
            span = list.offsetHeight || 1;
            offsets = beats.map((b) => b.offsetTop);
            pick(self.progress);
          },
          onUpdate: (self) => pick(self.progress),
        });
      }

      return () => mm.revert();
    },
    { scope: root, dependencies: [sceneOn] },
  );

  const openProject = (
    e: React.MouseEvent<HTMLAnchorElement>,
    slug: string,
    name: string,
  ) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    transitionTo(
      projectPath(slug),
      e.currentTarget,
      "#3BA7F2",
      name.toUpperCase(),
    );
  };

  return (
    <section ref={root} id="why" className="wb" aria-labelledby="wb-title">
      <div className="wb-wrap">
        <p className="wb-eyebrow">
          <JpTerm
            jp="道"
            reading="michi"
            meaning="The way: a path you keep walking"
            className="wb-eyebrow__kanji"
          />
          The honest version
        </p>
        <HeadingReveal
          as="h2"
          id="wb-title"
          className="wb-title"
          scrollStart="top 85%"
        >
          Why I build
        </HeadingReveal>

        <p className="wb-statement">
          {STATEMENT.split(" ").map((w, i) => (
            <React.Fragment key={i}>
              <span className="wb-statement__w">{w}</span>{" "}
            </React.Fragment>
          ))}
        </p>

        <div className="wb-journey">
          {/* The month being read, turning over like a counter (desktop) */}
          <div className="wb-aside" aria-hidden="true">
            <span className="wb-aside__year">2026</span>
            <span className="wb-aside__window">
              <span
                className="wb-aside__reel"
                style={{ transform: `translateY(${-active}em)` }}
              >
                {BEATS.map((b) => (
                  <span
                    key={b.when}
                    className="wb-aside__month"
                    data-now={b.when === "Now" || undefined}
                  >
                    {b.when}
                  </span>
                ))}
              </span>
            </span>
            <span className="wb-aside__count">
              {String(active + 1).padStart(2, "0")} /{" "}
              {String(BEATS.length).padStart(2, "0")}
            </span>
            <p className="wb-aside__note">
              Six builds in eight months, each one a little harder than the
              last.
            </p>
          </div>

          <div className="wb-beats">
            <span className="wb-beats__track" aria-hidden="true">
              <span className="wb-beats__fill" />
            </span>
            <ol className="wb-beats__list">
              {BEATS.map((b, i) => {
                const now = b.when === "Now";
                return (
                  <li
                    key={b.when}
                    className={`wb-beat${now ? " wb-beat--now" : ""}`}
                    data-passed={i <= active || undefined}
                  >
                    <span className="wb-beat__dot" aria-hidden="true" />
                    <div className="wb-beat__body">
                      <p className="wb-beat__when">
                        <span>{now ? "Now" : `${b.when} 2026`}</span>
                        {b.span && (
                          <span className="wb-beat__span">{b.span}</span>
                        )}
                      </p>
                      <h3 className="wb-beat__title">{b.title}</h3>
                      <p className="wb-beat__text">{b.text}</p>
                      {b.project && (
                        <a
                          href={projectPath(b.project.slug)}
                          className="ftr-link wb-beat__link"
                          onClick={(e) =>
                            openProject(e, b.project!.slug, b.project!.name)
                          }
                        >
                          <TextRoll
                            className="ftr-link__roll"
                            style={{ lineHeight: 1.25 }}
                          >
                            {b.project.name}
                          </TextRoll>
                          <ArrowUpRight aria-hidden="true" />
                        </a>
                      )}
                      {now && (
                        <ButtonWithIcon
                          className="wb-beat__cta"
                          onClick={(e) =>
                            transitionTo(
                              "/contact",
                              e.currentTarget,
                              "#3BA7F2",
                              "CONTACT",
                            )
                          }
                        >
                          Start your project
                        </ButtonWithIcon>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        <div className="wb-promises">
          <p className="wb-promises__label">What you can count on</p>
          <ul className="wb-promises__list">
            {PROMISES.map((p, i) => (
              <li key={p.title} className="wb-promise">
                <span className="wb-promise__num">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="wb-promise__title">{p.title}</h3>
                <p className="wb-promise__text">{p.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default WhyIBuildSection;
