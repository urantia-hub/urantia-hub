import { baseEmailTemplate } from "./baseEmailTemplate";

interface ChangelogUpdateEmailProps {
  version: string;
  changes: string[];
  changelogUrl: string;
  images?: Array<{
    url: string;
    alt: string;
    caption?: string;
  }>;
}

export const getChangelogUpdateEmailHTML = (
  props: ChangelogUpdateEmailProps
) => {
  const imagesSection = props.images?.length
    ? `
    <tr>
      <td style="padding: 0 50px 32px;">
        ${props.images
          .map(
            (image) => `
          <div style="margin-bottom: 24px;">
            <img
              src="${image.url}"
              alt="${image.alt}"
              style="width: 100%; border-radius: 8px; margin-bottom: 8px;"
            />
            ${
              image.caption
                ? `<p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">${image.caption}</p>`
                : ""
            }
          </div>
        `
          )
          .join("")}
      </td>
    </tr>`
    : "";

  const content = `
    <!-- Content -->
    <tr>
      <td style="padding: 0 50px 32px;">
        <h2 style="color: #111827; font-size: 20px; font-weight: 600; margin: 0 0 12px;">New Updates to UrantiaHub (v${
          props.version
        })</h2>
        <p style="color: #4b5563; font-size: 15px; line-height: 24px; margin: 0 0 24px;">
          We've released new features and improvements:
        </p>
        <ul style="color: #4b5563; font-size: 15px; line-height: 24px; margin: 0 0 24px; padding-left: 20px;">
          ${props.changes
            .map(
              (change) => `
            <li style="margin-bottom: 8px;">
              ${change.replace(/&/g, "&amp;")}
            </li>`
            )
            .join("")}
        </ul>
        <a href="${props.changelogUrl}"
           style="background-color: #3b82f6; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: 500; display: inline-block; transition: background-color 0.2s;">
          View full changelog
        </a>
      </td>
    </tr>
    ${imagesSection}
  `;

  return baseEmailTemplate({
    title: "New Updates to UrantiaHub",
    content,
  });
};

export const getChangelogUpdateEmailText = (
  props: ChangelogUpdateEmailProps
) => {
  return `
    New Updates to UrantiaHub v${props.version}

    We've released new features and improvements:

    ${props.changes
      .map((change) => `- ${change.replace(/<[^>]+>/g, "")}`)
      .join("\n")}

    View full changelog: ${props.changelogUrl}
  `;
};
