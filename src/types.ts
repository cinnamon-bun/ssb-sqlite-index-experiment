
type MsgKey = string;  // '%...'
type AuthorKey = string;  // '@...'
type BlobRef = string;  // '&...'

type Outer = {
    key: MsgKey,
    value: {
        previous: MsgKey,
        author: AuthorKey,
        sequence: number,
        timestamp: number,  // author's asserted timestamp
        hash: 'sha256',
        content: Content,
        signature: string,
    }
    timestamp: number,   // when we received it
}

type Content =
      About
    | Channel
    | Contact
    | Post
    | Pub
    | Vote;

type About = {
    type: 'about',
    about: AuthorKey | MsgKey,
    image?: BlobRef,
    attendee: any, // ?
}

type Channel = {
    type: 'channel',
    channel: string,
    subscribed: boolean,
}

type Contact = {
    type: 'contact',
    contact: AuthorKey,
    following: boolean,
    pub?: boolean,
}

type Post = {
    type: 'post',
    root?: MsgKey,
    branch?: MsgKey,
    channel?: string | null,
    recps: null,  //?
    text: string,
    mentions: [],   // ?
}

type Pub = {
    type: 'pub',
    address: any,  // ?
}

type Vote = {
    type: 'vote',
    channel: string,
    vote: any,   //?
}





