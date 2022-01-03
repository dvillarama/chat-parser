const { readdir, readFileSync, writeFileSync } = require("fs");

let userMessages = [];
let userCount = {};
const dates = [];
const dateCount = {};

const debug  = require("debug")('chat')

ALIASES = {  'hernandez, maria jose': 'maria jose hernandez' }

const store = (name, line) => {
  let clean = name?.trim().toLowerCase();

  clean = ALIASES[clean] || clean;

  if (userCount[clean]) {
    userCount[clean] += 1;
  } else {
    userCount[clean] = 1;
  }

  userMessages.push({ name: clean, line });
};

const saveLecture = (date) => {
  userMessages.sort((a, b) => a.name?.localeCompare(b.name));
  let currentUser = ""
  const data = userMessages.reduce((current, msg) => {
    current += `${msg.name}\t${msg.line}\n`
    return current;
  }, "");
  writeFileSync(`./output/${date}-chat`, data);
};

const saveDateCount = (date) => {
  Object.keys(userCount).forEach((name) => {
    if (dateCount[name]) {
      dateCount[name].push({ date, count: userCount[name] });
    } else {
      dateCount[name] = [{ date, count: userCount[name] }];
    }
  });
};


const processChat = (date, chat) => {
  const lines = chat.split("\n");
  let pattern = /.*From(?<name>.*?)to/;
  for (let i = 0; i < lines.length; i++) {
    let [match, name] = lines[i].match(pattern) || [];

    if (name) {
      store(name, lines[++i].replace(/\t/g, ''));
    }
  }
};

const processFile = (file) => {
  userMessages = []; // reset
  userCount = {};
  const [date] = file.split(" ");
  const chat = readFileSync(
    `./lectures/${file}/meeting_saved_chat.txt`,
    "utf8"
  );
  debug(`reading ${file}`)
  dates.push(date);
  processChat(date, chat);
  saveLecture(date);
  saveDateCount(date);
};

const createCsvFile = () => {
  const data = [["name", ...dates].join(",")];
  Object.keys(dateCount).forEach((name) => {
    const line = [name];
    dates.forEach((date) => {
      const { count } = dateCount[name].find((dt) => dt.date === date) || {
        count: 0,
      };
      line.push(count);
    });
    data.push(line.join(","));
  });

  writeFileSync(`./total.csv`, data.join("\n"));

};

readdir("./lectures", (err, files) => {
  if (err) {
    console.error(err);
  } else {
    files.forEach((file) => {
      processFile(file);
    });
    createCsvFile();
  }
});
