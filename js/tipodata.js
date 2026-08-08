/* TIPODATA.JS — dados estruturais das tipologias, extraídos do grafo de
   conhecimento (Filatova, Gulenko, Palmer, Pietrak). Gerado, não editar à mão. */
const TIPO_KG={
 "im": [
  {
   "symbol": "Ne",
   "jung_name": "Extraverted Intuition",
   "socionics_name": "Intuition of Possibilities",
   "attitude": "extraverted",
   "function": "intuition",
   "class": "irrational/perceiving",
   "dynamics": "static",
   "kind": "object"
  },
  {
   "symbol": "Ni",
   "jung_name": "Introverted Intuition",
   "socionics_name": "Intuition of Time",
   "attitude": "introverted",
   "function": "intuition",
   "class": "irrational/perceiving",
   "dynamics": "dynamic",
   "kind": "field"
  },
  {
   "symbol": "Se",
   "jung_name": "Extraverted Sensing",
   "socionics_name": "Volitional / Force Sensing",
   "attitude": "extraverted",
   "function": "sensing",
   "class": "irrational/perceiving",
   "dynamics": "static",
   "kind": "object"
  },
  {
   "symbol": "Si",
   "jung_name": "Introverted Sensing",
   "socionics_name": "Experiential / Comfort Sensing",
   "attitude": "introverted",
   "function": "sensing",
   "class": "irrational/perceiving",
   "dynamics": "dynamic",
   "kind": "field"
  },
  {
   "symbol": "Te",
   "jung_name": "Extraverted Thinking",
   "socionics_name": "Business / Practical Logic",
   "attitude": "extraverted",
   "function": "thinking",
   "class": "rational/judging",
   "dynamics": "dynamic",
   "kind": "object"
  },
  {
   "symbol": "Ti",
   "jung_name": "Introverted Thinking",
   "socionics_name": "Structural Logic",
   "attitude": "introverted",
   "function": "thinking",
   "class": "rational/judging",
   "dynamics": "static",
   "kind": "field"
  },
  {
   "symbol": "Fe",
   "jung_name": "Extraverted Feeling",
   "socionics_name": "Ethics of Emotions",
   "attitude": "extraverted",
   "function": "feeling",
   "class": "rational/judging",
   "dynamics": "dynamic",
   "kind": "object"
  },
  {
   "symbol": "Fi",
   "jung_name": "Introverted Feeling",
   "socionics_name": "Ethics of Relations",
   "attitude": "introverted",
   "function": "feeling",
   "class": "rational/judging",
   "dynamics": "static",
   "kind": "field"
  }
 ],
 "quadras": [
  {
   "name": "Alpha Quadra",
   "spirit": "open discussion of ideas, comfort, lightness",
   "valued_elements": [
    "Ne",
    "Ti",
    "Fe",
    "Si"
   ]
  },
  {
   "name": "Beta Quadra",
   "spirit": "hierarchy, drama, group loyalty, willpower",
   "valued_elements": [
    "Se",
    "Ti",
    "Fe",
    "Ni"
   ]
  },
  {
   "name": "Gamma Quadra",
   "spirit": "pragmatism, personal bonds, results, critique",
   "valued_elements": [
    "Se",
    "Fi",
    "Te",
    "Ni"
   ]
  },
  {
   "name": "Delta Quadra",
   "spirit": "humanism, practicality, quiet self-improvement",
   "valued_elements": [
    "Ne",
    "Fi",
    "Te",
    "Si"
   ]
  }
 ],
 "modelA": [
  {
   "position": 1,
   "position_name": "leading",
   "block": "Ego",
   "ring": "mental",
   "strength": "strong",
   "awareness": "conscious"
  },
  {
   "position": 2,
   "position_name": "creative",
   "block": "Ego",
   "ring": "mental",
   "strength": "strong",
   "awareness": "conscious"
  },
  {
   "position": 3,
   "position_name": "role",
   "block": "Superego",
   "ring": "mental",
   "strength": "weak",
   "awareness": "conscious"
  },
  {
   "position": 4,
   "position_name": "vulnerable",
   "block": "Superego",
   "ring": "mental",
   "strength": "weak",
   "awareness": "conscious"
  },
  {
   "position": 5,
   "position_name": "suggestive",
   "block": "Superid",
   "ring": "vital",
   "strength": "weak",
   "awareness": "unconscious"
  },
  {
   "position": 6,
   "position_name": "mobilizing",
   "block": "Superid",
   "ring": "vital",
   "strength": "weak",
   "awareness": "unconscious"
  },
  {
   "position": 7,
   "position_name": "ignoring",
   "block": "Id",
   "ring": "vital",
   "strength": "strong",
   "awareness": "unconscious"
  },
  {
   "position": 8,
   "position_name": "demonstrative",
   "block": "Id",
   "ring": "vital",
   "strength": "strong",
   "awareness": "unconscious"
  }
 ],
 "stypes": [
  {
   "acronym": "ILE",
   "code": "ENTp",
   "pseudonym": "Don Quixote",
   "gulenko_name": "Seeker",
   "full_name": "intuitive-logical extravert",
   "quadra": "Alpha",
   "leading": "Ne",
   "creative": "Ti",
   "temperament": "flexible-maneuvering",
   "club": "Researchers"
  },
  {
   "acronym": "SEI",
   "code": "ISFp",
   "pseudonym": "Dumas",
   "gulenko_name": "Mediator",
   "full_name": "sensory-ethical introvert",
   "quadra": "Alpha",
   "leading": "Si",
   "creative": "Fe",
   "temperament": "receptive-adaptive",
   "club": "Socials"
  },
  {
   "acronym": "ESE",
   "code": "ESFj",
   "pseudonym": "Hugo",
   "gulenko_name": "Enthusiast",
   "full_name": "ethical-sensory extravert",
   "quadra": "Alpha",
   "leading": "Fe",
   "creative": "Si",
   "temperament": "linear-assertive",
   "club": "Socials"
  },
  {
   "acronym": "LII",
   "code": "INTj",
   "pseudonym": "Robespierre",
   "gulenko_name": "Analyst",
   "full_name": "logical-intuitive introvert",
   "quadra": "Alpha",
   "leading": "Ti",
   "creative": "Ne",
   "temperament": "balanced-stable",
   "club": "Researchers"
  },
  {
   "acronym": "EIE",
   "code": "ENFj",
   "pseudonym": "Hamlet",
   "gulenko_name": "Mentor",
   "full_name": "ethical-intuitive extravert",
   "quadra": "Beta",
   "leading": "Fe",
   "creative": "Ni",
   "temperament": "linear-assertive",
   "club": "Humanitarians"
  },
  {
   "acronym": "LSI",
   "code": "ISTj",
   "pseudonym": "Maxim Gorky",
   "gulenko_name": "Inspector",
   "full_name": "logical-sensory introvert",
   "quadra": "Beta",
   "leading": "Ti",
   "creative": "Se",
   "temperament": "balanced-stable",
   "club": "Pragmatists"
  },
  {
   "acronym": "SLE",
   "code": "ESTp",
   "pseudonym": "Zhukov",
   "gulenko_name": "Marshal",
   "full_name": "sensory-logical extravert",
   "quadra": "Beta",
   "leading": "Se",
   "creative": "Ti",
   "temperament": "flexible-maneuvering",
   "club": "Pragmatists"
  },
  {
   "acronym": "IEI",
   "code": "INFp",
   "pseudonym": "Yesenin",
   "gulenko_name": "Lyricist",
   "full_name": "intuitive-ethical introvert",
   "quadra": "Beta",
   "leading": "Ni",
   "creative": "Fe",
   "temperament": "receptive-adaptive",
   "club": "Humanitarians"
  },
  {
   "acronym": "SEE",
   "code": "ESFp",
   "pseudonym": "Napoleon",
   "gulenko_name": "Politician",
   "full_name": "sensory-ethical extravert",
   "quadra": "Gamma",
   "leading": "Se",
   "creative": "Fi",
   "temperament": "flexible-maneuvering",
   "club": "Socials"
  },
  {
   "acronym": "ILI",
   "code": "INTp",
   "pseudonym": "Balzac",
   "gulenko_name": "Critic",
   "full_name": "intuitive-logical introvert",
   "quadra": "Gamma",
   "leading": "Ni",
   "creative": "Te",
   "temperament": "receptive-adaptive",
   "club": "Researchers"
  },
  {
   "acronym": "LIE",
   "code": "ENTj",
   "pseudonym": "Jack London",
   "gulenko_name": "Entrepreneur",
   "full_name": "logical-intuitive extravert",
   "quadra": "Gamma",
   "leading": "Te",
   "creative": "Ni",
   "temperament": "linear-assertive",
   "club": "Researchers"
  },
  {
   "acronym": "ESI",
   "code": "ISFj",
   "pseudonym": "Dreiser",
   "gulenko_name": "Guardian",
   "full_name": "ethical-sensory introvert",
   "quadra": "Gamma",
   "leading": "Fi",
   "creative": "Se",
   "temperament": "balanced-stable",
   "club": "Socials"
  },
  {
   "acronym": "LSE",
   "code": "ESTj",
   "pseudonym": "Stirlitz",
   "gulenko_name": "Administrator",
   "full_name": "logical-sensory extravert",
   "quadra": "Delta",
   "leading": "Te",
   "creative": "Si",
   "temperament": "linear-assertive",
   "club": "Pragmatists"
  },
  {
   "acronym": "EII",
   "code": "INFj",
   "pseudonym": "Dostoevsky",
   "gulenko_name": "Humanist",
   "full_name": "ethical-intuitive introvert",
   "quadra": "Delta",
   "leading": "Fi",
   "creative": "Ne",
   "temperament": "balanced-stable",
   "club": "Humanitarians"
  },
  {
   "acronym": "IEE",
   "code": "ENFp",
   "pseudonym": "Huxley",
   "gulenko_name": "Advisor",
   "full_name": "intuitive-ethical extravert",
   "quadra": "Delta",
   "leading": "Ne",
   "creative": "Fi",
   "temperament": "flexible-maneuvering",
   "club": "Humanitarians"
  },
  {
   "acronym": "SLI",
   "code": "ISTp",
   "pseudonym": "Gabin",
   "gulenko_name": "Craftsman",
   "full_name": "sensory-logical introvert",
   "quadra": "Delta",
   "leading": "Si",
   "creative": "Te",
   "temperament": "receptive-adaptive",
   "club": "Pragmatists"
  }
 ],
 "etypes": [
  {
   "number": 1,
   "palmer_name": "The Perfectionist",
   "triad": "gut",
   "passion": "anger",
   "preoccupations": "correctness, internal critic, error-noticing, suppressed anger"
  },
  {
   "number": 2,
   "palmer_name": "The Giver",
   "triad": "heart",
   "passion": "pride",
   "preoccupations": "gaining approval by meeting others' needs, altering self-presentation, pride in being needed"
  },
  {
   "number": 3,
   "palmer_name": "The Performer",
   "triad": "heart",
   "passion": "deceit",
   "preoccupations": "achievement, image, efficiency, identification with roles and success"
  },
  {
   "number": 4,
   "palmer_name": "The Tragic Romantic",
   "triad": "heart",
   "passion": "envy",
   "preoccupations": "longing for the absent ideal, melancholy, authenticity, attraction to the unavailable"
  },
  {
   "number": 5,
   "palmer_name": "The Observer",
   "triad": "head",
   "passion": "avarice",
   "preoccupations": "privacy, detachment, knowledge-hoarding, minimizing needs, compartmentalization"
  },
  {
   "number": 6,
   "palmer_name": "The Devil's Advocate",
   "triad": "head",
   "passion": "fear",
   "preoccupations": "doubt, scanning for danger, authority ambivalence, phobic/counterphobic strategies"
  },
  {
   "number": 7,
   "palmer_name": "The Epicure",
   "triad": "head",
   "passion": "gluttony",
   "preoccupations": "pleasant options, future planning, keeping options open, avoiding pain"
  },
  {
   "number": 8,
   "palmer_name": "The Boss",
   "triad": "gut",
   "passion": "lust",
   "preoccupations": "control, justice, confrontation, excess, protecting the weak, denial of vulnerability"
  },
  {
   "number": 9,
   "palmer_name": "The Mediator",
   "triad": "gut",
   "passion": "sloth",
   "preoccupations": "merging with others' agendas, self-forgetting, indolence toward own priorities"
  }
 ],
 "triads": [
  {
   "id": "triad:gut",
   "name": "Gut / Instinctive Triad (8-9-1)",
   "core_emotion": "anger"
  },
  {
   "id": "triad:heart",
   "name": "Heart / Image Triad (2-3-4)",
   "core_emotion": "shame/image"
  },
  {
   "id": "triad:head",
   "name": "Head / Fear Triad (5-6-7)",
   "core_emotion": "fear"
  }
 ],
 "rel": [
  {
   "id": "relationdef:identity",
   "name": "Identity"
  },
  {
   "id": "relationdef:duality",
   "name": "Duality"
  },
  {
   "id": "relationdef:activation",
   "name": "Activation"
  },
  {
   "id": "relationdef:mirror",
   "name": "Mirror"
  },
  {
   "id": "relationdef:kindred",
   "name": "Kindred (Comparative)"
  },
  {
   "id": "relationdef:business",
   "name": "Business (Look-alike)"
  },
  {
   "id": "relationdef:semi_duality",
   "name": "Semi-duality (Half-dual)"
  },
  {
   "id": "relationdef:mirage",
   "name": "Mirage (Illusionary)"
  },
  {
   "id": "relationdef:super_ego",
   "name": "Super-ego"
  },
  {
   "id": "relationdef:extinguishment",
   "name": "Extinguishment (Contrary)"
  },
  {
   "id": "relationdef:quasi_identity",
   "name": "Quasi-identity"
  },
  {
   "id": "relationdef:conflict",
   "name": "Conflict"
  },
  {
   "id": "relationdef:supervision",
   "name": "Supervision (Revision)"
  },
  {
   "id": "relationdef:benefit",
   "name": "Benefit (Social order/request)"
  }
 ]
};
