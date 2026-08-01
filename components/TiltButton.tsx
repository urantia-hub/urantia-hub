import { useRef } from "react";
import Link from "next/link";

const TiltButton = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => {
  const buttonRef = useRef<HTMLAnchorElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!buttonRef.current) return;

    const button = buttonRef.current;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotateX = ((-y / (rect.height / 2)) * 15).toFixed(2);
    const rotateY = ((x / (rect.width / 2)) * 10).toFixed(2);

    button.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(20px)`;
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!buttonRef.current) return;
    buttonRef.current.style.transform =
      "perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)";
  };

  // API routes 307 to a page; a client-side transition to one renders the
  // target page with empty props, so let the browser follow the redirect.
  const Anchor = href.startsWith("/api/") ? "a" : Link;

  return (
    <div style={{ perspective: "1000px" }}>
      <Anchor
        ref={buttonRef}
        href={href}
        className="inline-block tilt-button fade-in bg-white/95 text-gray-600 font-bold py-4 px-8 rounded-lg
          shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all duration-200 ease-out
          hover:no-underline hover:bg-white hover:text-gray-800
          hover:shadow-[0_0_25px_rgba(255,255,255,0.5)]
          active:scale-95 active:shadow-lg"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        {children}
      </Anchor>
    </div>
  );
};

export default TiltButton;
