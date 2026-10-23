/** Names handed to a player who has not typed one: animals and fruit, 4 to 8 letters (the lobby's name box keeps what the player types instead). */
export const FUN_NAMES: readonly string[] = [
  'Otter', 'Badger', 'Falcon', 'Gecko', 'Moose', 'Panda', 'Koala', 'Lemur', 'Newt', 'Wombat', 'Beaver', 'Heron', 'Toad', 'Marmot', 'Weasel',
  'Puffin', 'Quokka', 'Raven', 'Walrus', 'Ferret', 'Lynx', 'Bison', 'Parrot', 'Gopher', 'Pangolin', 'Mango', 'Papaya', 'Guava', 'Lemon', 'Cherry',
  'Apricot', 'Banana', 'Kiwi', 'Plum', 'Peach', 'Lychee', 'Melon', 'Berry', 'Lime', 'Pear', 'Grape', 'Orange', 'Quince', 'Damson', 'Coconut',
].filter((n) => n.length >= 4 && n.length <= 8);

/** A random one (presentation only: it is the player's name, never read by the sim). */
export const randomName = (): string => FUN_NAMES[Math.floor(Math.random() * FUN_NAMES.length)]!;
