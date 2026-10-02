import { GetServerSideProps } from "next";
import { generateRss } from "@/utils/changelogRss";

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.setHeader("Content-Type", "text/xml");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
  res.write(generateRss());
  res.end();

  return {
    props: {},
  };
};

const ChangelogRss = () => {
  return null;
};

export default ChangelogRss;
