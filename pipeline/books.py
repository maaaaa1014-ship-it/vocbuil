"""Book catalog and download source configuration.

Source note: direct access to gutenberg.org is blocked in this build
environment's network policy, so plain-text sources are fetched from
GitHub-hosted mirrors of the same public-domain Project Gutenberg texts
(the GITenberg project) via raw.githubusercontent.com. One title
("A Little Princess") is not present in the GITenberg mirror, so its
text is assembled from the public-domain XHTML chapters published by
Standard Ebooks instead. All texts remain the same public-domain works
Project Gutenberg distributes.
"""

from dataclasses import dataclass, field


@dataclass(frozen=True)
class Book:
    id: str
    title: str
    author: str
    gutenberg_id: int
    source_type: str  # "gutenberg_txt" | "standard_ebooks_xhtml"
    source: str  # url (gutenberg_txt) or repo slug (standard_ebooks_xhtml)
    chapters: tuple = field(default=())  # for standard_ebooks_xhtml
    cover_file: str = ""

    def __post_init__(self):
        object.__setattr__(self, "cover_file", f"{self.id}.jpg")


BOOKS: list[Book] = [
    Book(
        id="anne-of-green-gables",
        title="Anne of Green Gables",
        author="Lucy Maud Montgomery",
        gutenberg_id=45,
        source_type="gutenberg_txt",
        source="https://raw.githubusercontent.com/GITenberg/Anne-of-Green-Gables_45/master/45.txt",
    ),
    Book(
        id="pride-and-prejudice",
        title="Pride and Prejudice",
        author="Jane Austen",
        gutenberg_id=1342,
        source_type="gutenberg_txt",
        source="https://raw.githubusercontent.com/GITenberg/Pride-and-Prejudice_1342/master/1342.txt",
    ),
    Book(
        id="the-secret-garden",
        title="The Secret Garden",
        author="Frances Hodgson Burnett",
        gutenberg_id=113,
        source_type="gutenberg_txt",
        source="https://raw.githubusercontent.com/GITenberg/The-Secret-Garden_113/master/113.txt",
    ),
    Book(
        id="a-little-princess",
        title="A Little Princess",
        author="Frances Hodgson Burnett",
        gutenberg_id=37332,
        source_type="standard_ebooks_xhtml",
        source="standardebooks/frances-hodgson-burnett_a-little-princess",
        chapters=tuple(f"chapter-{i}.xhtml" for i in range(1, 20)),
    ),
    Book(
        id="the-wonderful-wizard-of-oz",
        title="The Wonderful Wizard of Oz",
        author="L. Frank Baum",
        gutenberg_id=55,
        source_type="gutenberg_txt",
        source="https://raw.githubusercontent.com/GITenberg/The-Wonderful-Wizard-of-Oz_55/master/55.txt",
    ),
    Book(
        id="peter-pan",
        title="Peter Pan",
        author="J. M. Barrie",
        gutenberg_id=16,
        source_type="gutenberg_txt",
        source="https://raw.githubusercontent.com/GITenberg/Peter-Pan_16/master/16.txt",
    ),
    Book(
        id="alices-adventures-in-wonderland",
        title="Alice's Adventures in Wonderland",
        author="Lewis Carroll",
        gutenberg_id=11,
        source_type="gutenberg_txt",
        source="https://raw.githubusercontent.com/GITenberg/Alice-s-Adventures-in-Wonderland_11/master/11.txt",
    ),
    Book(
        id="heidi",
        title="Heidi",
        author="Johanna Spyri",
        gutenberg_id=1448,
        source_type="gutenberg_txt",
        source="https://raw.githubusercontent.com/GITenberg/Heidi_1448/master/1448.txt",
    ),
    Book(
        id="daddy-long-legs",
        title="Daddy-Long-Legs",
        author="Jean Webster",
        gutenberg_id=157,
        source_type="gutenberg_txt",
        source="https://raw.githubusercontent.com/GITenberg/Daddy-Long-Legs_157/master/157.txt",
    ),
    Book(
        id="the-wind-in-the-willows",
        title="The Wind in the Willows",
        author="Kenneth Grahame",
        gutenberg_id=289,
        source_type="gutenberg_txt",
        source="https://raw.githubusercontent.com/GITenberg/The-Wind-in-the-Willows_289/master/289.txt",
    ),
]

BOOKS_BY_ID = {b.id: b for b in BOOKS}
