import 'dotenv/config';

export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function shorten(s) {
    if (s) {
        if (s.length > 20) {
            return s.substr(0, 17) + "...";
        }
        else {
            for (let i = s.length; i < 20; i++) {
                s = s.concat(" ");
            }
            return s;
        }
    }
}