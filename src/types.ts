
export type MsgKey = string;  // '%...'
export type AuthorKey = string;  // '@...'
export type BlobRef = string;  // '&...'

export type SSBMessage = {
    key: MsgKey,
    value: SSBValue,
    timestamp: number,   // when we received it
};

export type SSBValue = {
    previous: MsgKey,
    author: AuthorKey,
    sequence: number,
    timestamp: number,  // author's asserted timestamp
    hash: 'sha256',
    content: Content,
    signature: string,
};

export type Content =
      About
    | Channel
    | Contact
    | Post
    | Pub
    | Vote;

export type About = {
    type: 'about',
    about: AuthorKey | MsgKey,
    image?: BlobRef,
    attendee: any, // ?
};

export type Channel = {
    type: 'channel',
    channel: string,
    subscribed: boolean,
};

export type Contact = {
    type: 'contact',
    contact: AuthorKey,
    following: boolean,
    pub?: boolean,
};

export type Post = {
    type: 'post',
    root?: MsgKey,
    branch?: MsgKey,
    channel?: string | null,
    recps: null,  //?
    text: string,
    mentions: [],   // ?
};

export type Pub = {
    type: 'pub',
    address: any,  // ?
};

export type Vote = {
    type: 'vote',
    channel: string,
    vote: any,   //?
};





