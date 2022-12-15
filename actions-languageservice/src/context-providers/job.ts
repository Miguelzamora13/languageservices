import {data} from "@github/actions-expressions";
import {isMapping, isSequence, isString} from "@github/actions-workflow-parser";
import { MappingToken } from "@github/actions-workflow-parser/templates/tokens/mapping-token";
import {WorkflowContext} from "../context/workflow-context";

export function getJobContext(workflowContext: WorkflowContext): data.Dictionary {
  // https://docs.github.com/en/actions/learn-github-actions/contexts#job-context
  const jobContext = new data.Dictionary();
  const job = workflowContext.job;
  if (!job) {
    return jobContext
  }

  // Container
  const jobContainer = job.container;
  if (jobContainer && isMapping(jobContainer)) {
    let containerContext = createContainerContext(jobContainer, false);
    jobContext.add("container", containerContext);
  }

  // Services
  const jobServices = job.services;
  if (jobServices && isMapping(jobServices)) {
    const servicesContext = new data.Dictionary();
    for (const service of jobServices) {
      if (!isMapping(service.value)) {
        continue
      }
      let serviceContext = createContainerContext(service.value, true);
      servicesContext.add(service.key.toString(), serviceContext);
    }
    jobContext.add("services", servicesContext);
  }

  // Status
  jobContext.add("status", new data.Null());

  return jobContext;
}

function createContainerContext(container: MappingToken, isServices: boolean): data.Dictionary {
  const containerContext = new data.Dictionary();
  for (const token of container) {
    if (isString(token.value)) {
      // image and options
      // containerContext.add(token.key.toString(), new data.StringData(token.value.toString()));
    }
    else if (isSequence(token.value)) {
      // ports and volumes
      // service ports are the only thing that is part of the job context
      if (token.key.toString() !== "ports") {
        continue;
      }
      const ports = new data.Dictionary()
      for (const item of token.value) {
        // We can determine the context mapping fully only if the port is defined
        // as a mapping (i.e. <port1>:<port2>), single ports are assigned randomly
        const portParts = item.toString().split(":")
        if (isServices && portParts.length === 2) {
          ports.add(portParts[1], new data.StringData(portParts[0]));
        }
      }
      containerContext.add(token.key.toString(), ports);
    }
    else if (isMapping(token.value)) {
      // credentials and env
      // const dict = new data.Dictionary();
      // for (const item of token.value) {
      //   containerContext.add(item.key.toString(), new data.StringData(item.value.toString()));
      // }
      // containerContext.add(token.key.toString(), dict);
    }
  }
  containerContext.add("id", new data.Null());
  containerContext.add("network", new data.Null());
  return containerContext;
}

