CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE conversations(  
    id UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
    create_date TIMESTAMP with time zone DEFAULT now()
);

CREATE TYPE role_enum AS ENUM ('system', 'assistant', 'user');

CREATE TABLE messages(  
    id UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    create_date TIMESTAMP with time zone DEFAULT now(),
    role role_enum NOT NULL,
    content TEXT NOT NULL
);
CREATE INDEX idx_messages_recent ON messages (conversation_id, create_date DESC);
