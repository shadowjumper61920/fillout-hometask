const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get('/:formId/filteredResponses', async (req, res) => {
    const { formId } = req.params;
    const {
        limit = 150,
        afterDate,
        beforeDate,
        offset = 0,
        status,
        includeEditLink,
        sort = 'asc',
        filters
    } = req.query;

    const API_KEY = process.env.FILLOUT_API_KEY; 
    const baseUrl = `https://api.fillout.com/v1/api/forms/${formId}/submissions`;

    try {
        const response = await axios.get(baseUrl, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
            },
            params: {
                limit: 150,
                afterDate,
                beforeDate,
                status,
                includeEditLink,
                sort,
            },
        });

        let filteredResponses = response.data.responses;
        if (filters) {
            const filterParams = JSON.parse(filters);
            filteredResponses = filteredResponses.filter(response =>
                filterParams.every(filter => {
                    const question = response.questions.find(q => q.id === filter.id);
                    if (!question) return false;
                    switch (filter.condition) {
                        case 'equals': return question.value === filter.value;
                        case 'does_not_equal': return question.value !== filter.value;
                        case 'greater_than': return new Date(question.value) > new Date(filter.value);
                        case 'less_than': return new Date(question.value) < new Date(filter.value);
                        default: return true;
                    }
                })
            );
        }

        const totalResponses = filteredResponses.length;
        const paginatedResponses = filteredResponses.slice(offset, parseInt(offset) + parseInt(limit));

        const filteredTotalCount = filteredResponses.length;
        const pageCount = Math.ceil(filteredTotalCount / limit);

        res.json({
            responses: paginatedResponses,
            totalResponses,
            pageCount,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching form responses' });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
