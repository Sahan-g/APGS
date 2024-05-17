const client = require('../databasepg')


const getData = async (req, res) => {
    const modulecode = req.params.modulecode;
    const assignmentid = req.params.assignmentid;
    const batch = req.params.batch;

    try {
        const result = await client.query(
            `SELECT marks FROM studentanswerscripts WHERE modulecode=$1 AND assignmentid=$2 AND batch=$3`,
            [modulecode, assignmentid, batch]
        );

        const marks = result.rows;

        return res.status(200).json({ marks });
    } catch (error) {
        console.error('Error querying the database:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};


module.exports= {getData}