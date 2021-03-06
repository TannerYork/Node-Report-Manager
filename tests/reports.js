const app = require("../server");
const chai = require("chai");
const chaiHttp = require("chai-http");

const expect = chai.expect;
const agent = chai.request.agent(app);
const adminAgent = chai.request.agent(app);

const Report = require("../models/Report.js");
const User = require("../models/User.js");
const Authority = require("../models/Authority.js");

chai.should();
chai.use(chaiHttp);

describe("Reports", function () {
    // Post that we'll use for testing purposes
    var authorityId = "5ddf784f9dbb9f1530b96033";
    var adminId = "5ddf76af01c5992ec4fa1c8c";
    var userId = "5ddf76af01c5992ec4fa1c9c";
    var reportId = "5ddf784f9dbb9f1530b96022";

    before(function (done) {
        const authority = new Authority({
            _id: authorityId,
            name: "testauthority",
            users: [],
            reports: [],
        });
        authority.save();
        done();
    });

    before(function (done) {
        adminAgent
            .post("/sign-up")
            .set({ "content-type": "application/json" })
            .send({
                _id: adminId,
                username: "testadmin",
                email: "admin@email.com",
                password: "password",
                authority: authorityId,
                access_level: "admin",
            })
            .end((err, res) => {
                expect(res.status).to.equal(200);
                done();
            });
    });

    before(function (done) {
        agent
            .post("/sign-up")
            .set({ "content-type": "application/json" })
            .send({
                _id: userId,
                username: "testuser",
                email: "user@email.com",
                password: "password",
            })
            .end(function (err, res) {
                expect(res.status).to.equal(200);
                done();
            });
    });

    before(function (done) {
        const report = new Report({
            _id: reportId,
            title: "report",
            details: "report details",
            author: userId,
        });
        report.save();
        done();
    });

    it("should get all reports at GET /reports", function (done) {
        agent
            .get("/reports")
            .then(function (res) {
                res.should.have.status(200);
                expect(res.body).to.be.an("array");
                done();
            })
            .catch((err) => {
                done(err);
            });
    });

    it("should get all authority reports at GET /authority/reports", function (done) {
        adminAgent
            .get("/authority/reports")
            .then(function (res) {
                res.should.have.status(200);
                expect(res.body).to.be.an("array");
                done();
            })
            .catch((err) => {
                done(err);
            });
    });

    it("should not get all reports at GET /authority/reports if no authority", function (done) {
        agent
            .get("/authority/reports")
            .then(function (res) {
                res.should.have.status(401);
                expect(res.body).to.be("object");
                expect(res.body).to.haveOwnProperty("error");
                done();
            })
            .catch((err) => {
                done(err);
            });
    });

    it("should create with valid attributes at POST /report/new", function (done) {
        Report.estimatedDocumentCount()
            .then(function (initialDocCount) {
                agent
                    .post("/report/new")
                    .set("content-type", "application/json")
                    .send({ title: "report", details: "detials", authority: authorityId })
                    .then(function (res) {
                        Report.estimatedDocumentCount()
                            .then(function (newDocCount) {
                                expect(res).to.have.status(200);
                                expect(newDocCount).to.be.equal(initialDocCount + 1);
                                done();
                            })
                            .catch(function (err) {
                                done(err);
                            });
                    })
                    .catch(function (err) {
                        done(err);
                    });
            })
            .catch(function (err) {
                done(err);
            });
    });

    it("should get specifc report at GET /authority/reports/reportId:", function (done) {
        adminAgent
            .get(`/authority/reports/${reportId}`)
            .then(function (res) {
                res.should.have.status(200);
                expect(res.body).to.be.an("object");
                done();
            })
            .catch((err) => {
                done(err);
            });
    });

    it("should not get specifc report at GET /authority/reports/reportId if no authority", function (done) {
        agent
            .get(`/authority/reports/${reportId}`)
            .then(function (res) {
                res.should.have.status(401);
                expect(res.body).to.be.an("object");
                expect(res.body).to.have.property("error");
                done();
            })
            .catch((err) => {
                done(err);
            });
    });

    it("should update specifc report at PUT /authority/reports/reportId", function (done) {
        adminAgent
            .put(`/authority/reports/${reportId}`)
            .set("content-type", "application/json")
            .send({ details: "new details" })
            .then(function (res) {
                res.should.have.status(200);
                expect(res.body).to.be.an("object");
                expect(res.body.details).to.equal("new details");
                done();
            })
            .catch((err) => {
                done(err);
            });
    });

    it("should not update specifc report at PUT /authority/reports/reportId if not authority admin", function (done) {
        agent
            .put(`/authority/testauthority/reports/${reportId}`)
            .set("content-type", "application/json")
            .send({ details: "new details" })
            .then(function (res) {
                res.should.have.status(401);
                expect(res.body).to.be.an("object");
                expect(res.body).to.property("error");
                done();
            })
            .catch((err) => {
                done(err);
            });
    });

    it("should delete report at DELET /authority/reports/reportId", function (done) {
        adminAgent
            .delete(`/authority/reports/${reportId}`)
            .set("content-type", "application/json")
            .send()
            .then(function (res) {
                res.should.have.status(200);
                expect(res.body).to.be.an("object");
                expect(res.body).to.have.property("success");
                done();
            })
            .catch((err) => {
                done(err);
            });
    });

    it("should not delete report at DELET /authority/reports/reportId is not authority admin", function (done) {
        agent
            .delete(`/authority/testauthority/reports/${reportId}`)
            .set("content-type", "application/json")
            .send()
            .then(function (res) {
                res.should.have.status(401);
                expect(res.body).to.be.an("object");
                expect(res.body).to.have.property("error");
                done();
            })
            .catch((err) => {
                done(err);
            });
    });

    after(async function () {
        await Authority.deleteMany({});
        await Report.deleteMany({});
        await User.deleteMany({});
        return;
    });
});
