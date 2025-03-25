import moment from 'moment';

function groupedDays(messages) {
  return messages.reduce((acc, el, i) => {
    const messageDay = moment(el.created_at).format('YYYY-MM-DD');
    if (acc[messageDay]) {
      return { ...acc, [messageDay]: acc[messageDay].concat([el]) };
    }
    return { ...acc, [messageDay]: [el] };
  }, {});
}

function generateItems(messages) {
  const days = groupedDays(messages);
  const sortedDays = Object.keys(days).sort(
    (x, y) => moment(x, 'YYYY-MM-DD').unix() - moment(y, 'YYYY-MM-DD').unix()
  );
  const items = sortedDays.reduce((acc, date) => {
    const sortedMessages = days[date].sort(
      (x, y) => new Date(x.created_at) - new Date(y.created_at)
    );
    return acc.concat([{ type: 'day', date, id: date },...sortedMessages, ]);
  }, []);
  return items;
}

export default generateItems;