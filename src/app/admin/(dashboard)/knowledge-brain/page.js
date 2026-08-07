import KnowledgeBrainClient from "./KnowledgeBrainClient";
import { getKnowledgeRules, getDictionaryTerms } from "./actions";

export const metadata = {
  title: "Knowledge Brain | Culture Média CMN",
};

export default async function KnowledgeBrainPage() {
  const rules = await getKnowledgeRules();
  const dictionary = await getDictionaryTerms();

  return <KnowledgeBrainClient initialRules={rules} initialDictionary={dictionary} />;
}
