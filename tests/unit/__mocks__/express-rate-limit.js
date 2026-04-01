const mockRateLimit = jest.fn().mockImplementation((req, res, next) => next());

const rateLimit = jest.fn().mockImplementation(() => mockRateLimit);

module.exports = rateLimit;
module.exports.default = rateLimit;
