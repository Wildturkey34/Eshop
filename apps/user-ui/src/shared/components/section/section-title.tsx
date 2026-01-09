import TitleBorder from 'apps/user-ui/src/assets/svgs/title-border';

const SectionTitle = ({ title }: { title: string }) => {
  return (
    <div className="relative inline-block">
      <h1 className="md:text-3xl text-xl font-semibold mb-2">{title}</h1>
      <TitleBorder className="absolute -bottom-2 left-0 w-full max-w-[144px]" />
    </div>
  );
};

export default SectionTitle;
