import * as core from '@actions/core'
import * as github from '@actions/github'
import Octokit = require('@octokit/rest')

const token: string = core.getInput('token')
const base: string = core.getInput('base')
const labels: string[] = JSON.parse(core.getInput('labels'))
const repoOwner: string = github.context.repo.owner
const repo: string = github.context.repo.repo

function pullRequests(repoOwner:string, repo:string ):Promise<Octokit.Response<Octokit.PullsListResponse>> {
    let pr = new github.GitHub(token)
    let resp = pr.pulls.list({
        owner: repoOwner,
        repo: repo,
        base: base,
        state: open,
    }).catch(
        e => {
            core.info(e.message)
        }
    ) as Promise<Octokit.Response<Octokit.PullsListResponse>>
    return resp
}

function filterLabel(labels: Octokit.PullsListResponseItemLabelsItem[],target: string[]):boolean{
    let labelNames = labels.map((label) => {
        return label.name
    })
    core.info("Found PR with label names: " + labelNames)
    
    for (let label in target) {
        if (!labelNames.includes(label)) {
            return false;
        }
    }
    return true;
}

function setOutput(pull:Octokit.PullsListResponseItem[]){
    let output = ''
    for (const p of pull) {
        output = output + p.head.ref + " "
    }
    core.info("Found PRs: " + output)
    core.setOutput('pulls', output)
}

const now = Date.now()
const prom = pullRequests(repoOwner,repo)
prom.then((pulls) => {
    let claim = pulls.data.filter(
        p => filterLabel(p.labels, labels)
    )
    setOutput(claim)
})
