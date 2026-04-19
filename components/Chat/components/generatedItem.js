function toDateKey(dateStr) {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function groupedDays(messages) {
  return messages.reduce((acc, el, i) => {
    const messageDay = toDateKey(el.created_at);
    if (acc[messageDay]) {
      return { ...acc, [messageDay]: acc[messageDay].concat([el]) };
    }
    return { ...acc, [messageDay]: [el] };
  }, {});
}

function generateItems(messages) {
  const days = groupedDays(messages);
  const sortedDays = Object.keys(days).sort(
    (x, y) => new Date(x).getTime() - new Date(y).getTime(),
  );
  const items = sortedDays.reduce((acc, date) => {
    const sortedMessages = days[date].sort(
      (x, y) => new Date(x.created_at) - new Date(y.created_at),
    );
    return acc.concat([{ type: "day", date, id: date }, ...sortedMessages]);
  }, []);
  return items;
}

export default generateItems;
