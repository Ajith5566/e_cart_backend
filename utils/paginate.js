// utils/paginate.js
const paginate = async (model, query = {}, options = {}) => {
  const {
    page = 1,
    limit = 10,
    sort = { createdAt: -1 },
    populate = null,
    select = null,
  } = options;

  const skip = (Number(page) - 1) * Number(limit);

  let q = model.find(query).sort(sort).skip(skip).limit(Number(limit));
  if (populate) q = q.populate(populate);
  if (select)   q = q.select(select);

  const [data, total] = await Promise.all([
    q,
    model.countDocuments(query),
  ]);

  return {
    data,
    pagination: {
      total,
      page:       Number(page),
      limit:      Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
      hasNext:    Number(page) < Math.ceil(total / Number(limit)),
      hasPrev:    Number(page) > 1,
    },
  };
};

module.exports = paginate;