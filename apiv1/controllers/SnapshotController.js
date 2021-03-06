let SnapshotModel = require('./../models/SnapshotModel.js');
let verify = require('./../authorization/verifyAuth.js');

/**
 * SnapshotController.js
 *
 * @description :: Server-side logic for managing Snapshots.
 */
module.exports = {

    /**
     * SnapshotController.list()
     */
    list: function (req, res) {
        let token = req.headers['x-access-token'];
        verify.isAdmin(token).then(function (answer) {
            if (!answer) {
                res.status(401).send('Error 401: Not authorized');
            }
            else {
                // ToDo: Support comma separated list of categories
                let user = req.query.user ? { user: req.query.user } : null;
                let time = req.query.time ? { user: req.query.time } : null;
                let error = req.query.error ? { error: req.query.error } : null;

                let filter;
                // let sort;
                let range;
                let pageSize;
                let currentPage;
                let docConditions;
                let pageRange;
                if (req.query.filter != undefined) {
                    filter = JSON.parse(req.query.filter);
                }
                // if (req.query.sort != undefined) {
                //     sort = JSON.parse(req.query.sort);
                // }
                if (req.query.range != undefined) {
                    range = JSON.parse("\"" + req.query.range + "\"").split("[");
                    range.splice(0, 1);
                    range = range[0].split("]");
                    range.splice(1, 1);
                    range = range[0].split(",");
                    pageSize = range[1];
                    currentPage = range[0];
                }
                if (pageSize != undefined && currentPage != undefined) {
                    pageRange = {
                        'skip': (pageSize * (currentPage - 1)),
                        'limit': Number(pageSize)
                    };
                }

                docConditions = { ...pageRange };

                let queryParams = { ...user, ...time, ...error, ...filter };

                SnapshotModel.find(queryParams, {}, docConditions, function (err, Snapshot) {
                    if (err) {
                        return res.status(500).json({
                            message: 'Error when getting Snapshot.',
                            error: err
                        });
                    }
                    if (!Snapshot) {
                        return res.status(404).json({
                            message: 'No such Snapshot'
                        });
                    }
                    SnapshotModel.countDocuments(queryParams).exec(function (err, count) {
                        if (err) {
                            return next(err);
                        }
                        res.set('Total-Documents', count);
                        return res.json(Snapshot);
                    });
                });
            }
        });
    },

    /**
     * SnapshotController.show()
     */
    show: function (req, res) {
        let id = req.params.id;
        SnapshotModel.findOne({ _id: id }, function (err, Snapshot) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting Snapshot.',
                    error: err
                });
            }
            if (!Snapshot) {
                return res.status(404).json({
                    message: 'No such Snapshot'
                });
            }
            return res.json(Snapshot);
        });
    },

    /**
     * SnapshotController.show_via_snapshotNumber()
     */
    show_via_details: async function (req, res) {
        let user = await verify.verifyGoogleToken(req.params.user);
        let timestamp = req.params.timestamp;

        if(!user){
            return res.status(401).json({
                message: "Invalid token received",
                error: "Unauthorized"
            });
        }
        SnapshotModel.findOne({ user: user.toString(), timestamp: timestamp }, function (err, Snapshot) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting Snapshot.',
                    error: err
                });
            }
            if (!Snapshot) {
                return res.status(404).json({
                    message: 'No such Snapshot'
                });
            }
            return res.json(Snapshot);
        });
    },

    /**
      * SnapshotController.create()
      */
    /*
     * Will not allow duplicate snapshots at same time by same user
     */
    create: async function (req, res) {
        let user = await verify.verifyGoogleToken(req.body.user);
        if(!user && req.body.user !== 'anon'){
            return res.status(401).json({
                message: "Recieved invalid token",
                error: "Unauthorized"
            });
        }
        let newSnapshot = new SnapshotModel({
            user: user || 'anon',
            timestamp: req.body.timestamp,
            text: req.body.text,
            error: req.body.error
        });
        SnapshotModel.findOne({ user: newSnapshot.user, timestamp: newSnapshot.timestamp }, function (err, Snapshot) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when creating snapshot.',
                    error: err
                });
            }
            if (Snapshot != null) {
                return res.status(409).json({
                    message: 'A snapshot with this information already exists',
                });
            }
            else {
                Snapshot = newSnapshot;
                Snapshot.save(function (err, Snapshot) {
                    if (err) {
                        return res.status(500).json({
                            message: 'Error when creating Snapshot',
                            error: err
                        });
                    }
                    return res.status(201).json(Snapshot);
                });
            }
        });
    },

    /**
     * SnapshotController.remove()
     */
    remove: function (req, res) {
        let token = req.headers['x-access-token'];
        return res.status(401).send();
        // verify.isAdmin(token).then(function (answer) {
        //     if (!answer) {
        //         res.status(401).send('Error 401: Not authorized');
        //     }
        //     else {
        //         let id = req.params.id;
        //         SnapshotModel.findByIdAndRemove(id, function (err, Snapshot) {
        //             if (err) {
        //                 return res.status(500).json({
        //                     message: 'Error when deleting the Snapshot.',
        //                     error: err
        //                 });
        //             }
        //             return res.status(200).json();
        //         });
        //     }
        // })

    },

    /**
     * SnapshotController.remove_via_snapshotNumber()
     */
    remove_via_snapshotNumber: function (req, res) {
        let token = req.headers['x-access-token'];
        return res.status(401).send();
        // verify.isAdmin(token).then(function (answer) {
        //     if (!answer) {
        //         res.status(401).send('Error 401: Not authorized');
        //     }
        //     else {
        //         let snapshotNumber = req.params.snapshotNumber;
        //         SnapshotModel.deleteOne({ snapshotNumber: snapshotNumber }, function (err, Snapshot) {
        //             if (err) {
        //                 return res.status(500).json({
        //                     message: 'Error when deleting the Snapshot.',
        //                     error: err
        //                 });
        //             }
        //             return res.status(200).json();
        //         });
        //     }
        // })

    }
};
