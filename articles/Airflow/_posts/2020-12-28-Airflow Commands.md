---
layout: post
title: Airflow Commnands
tag:  Airflow
---

## Usage
```shell
# 查看支持的 commands
$ airflow --help
usage: airflow [-h]
               {backfill,list_dag_runs,list_tasks,clear,pause,unpause,trigger_dag,delete_dag,show_dag,pool,variables,kerberos,render,run,initdb,list_dags,dag_state,task_failed_deps,task_state,serve_logs,test,webserver,resetdb,upgradedb,checkdb,shell,scheduler,worker,flower,version,connections,create_user,delete_user,list_users,sync_perm,next_execution,rotate_fernet_key,config,info}
               ...

positional arguments:
  {backfill,list_dag_runs,list_tasks,clear,pause,unpause,trigger_dag,delete_dag,show_dag,pool,variables,kerberos,render,run,initdb,list_dags,dag_state,task_failed_deps,task_state,serve_logs,test,webserver,resetdb,upgradedb,checkdb,shell,scheduler,worker,flower,version,connections,create_user,delete_user,list_users,sync_perm,next_execution,rotate_fernet_key,config,info}
                        sub-command help
    backfill            Run subsections of a DAG for a specified date range.
                        If reset_dag_run option is used, backfill will first
                        prompt users whether airflow should clear all the
                        previous dag_run and task_instances within the
                        backfill date range. If rerun_failed_tasks is used,
                        backfill will auto re-run the previous failed task
                        instances within the backfill date range.
    list_dag_runs       List dag runs given a DAG id. If state option is
                        given, it will onlysearch for all the dagruns with the
                        given state. If no_backfill option is given, it will
                        filter outall backfill dagruns for given dag id.
    list_tasks          List the tasks within a DAG
    clear               Clear a set of task instance, as if they never ran
    pause               Pause a DAG
    unpause             Resume a paused DAG
    trigger_dag         Trigger a DAG run
    delete_dag          Delete all DB records related to the specified DAG
    show_dag            Displays DAG's tasks with their dependencies
    pool                CRUD operations on pools
    variables           CRUD operations on variables
    kerberos            Start a kerberos ticket renewer
    render              Render a task instance's template(s)
    run                 Run a single task instance
    initdb              Initialize the metadata database
    list_dags           List all the DAGs
    dag_state           Get the status of a dag run
    task_failed_deps    Returns the unmet dependencies for a task instance
                        from the perspective of the scheduler. In other words,
                        why a task instance doesn't get scheduled and then
                        queued by the scheduler, and then run by an executor).
    task_state          Get the status of a task instance
    serve_logs          Serve logs generate by worker
    test                Test a task instance. This will run a task without
                        checking for dependencies or recording its state in
                        the database.
    webserver           Start a Airflow webserver instance
    resetdb             Burn down and rebuild the metadata database
    upgradedb           Upgrade the metadata database to latest version
    checkdb             Check if the database can be reached.
    shell               Runs a shell to access the database
    scheduler           Start a scheduler instance
    worker              Start a Celery worker node
    flower              Start a Celery Flower
    version             Show the version
    connections         List/Add/Delete connections
    create_user         Create an account for the Web UI (FAB-based)
    delete_user         Delete an account for the Web UI
    list_users          List accounts for the Web UI
    sync_perm           Update permissions for existing roles and DAGs.
    next_execution      Get the next execution datetime of a DAG.
    rotate_fernet_key   Rotate all encrypted connection credentials and
                        variables; see
                        https://airflow.readthedocs.io/en/stable/howto/secure-
                        connections.html#rotating-encryption-keys.
    config              Show current application configuration
    info                Show information about current Airflow and environment

optional arguments:
  -h, --help            show this help message and exit
```

## backfill
```shell
# 查看具体命令的使用 airflow [command] --help
$ airflow backfill --help
usage: airflow backfill [-h] [-t TASK_REGEX] [-s START_DATE] [-e END_DATE]
                        [-m] [-l] [-x] [-y] [-i] [-I] [-sd SUBDIR]
                        [--pool POOL] [--delay_on_limit DELAY_ON_LIMIT] [-dr]
                        [-v] [-c CONF] [--reset_dagruns]
                        [--rerun_failed_tasks] [-B]
                        dag_id

positional arguments:
  dag_id                The id of the dag

optional arguments:
  -h, --help            show this help message and exit
  -t TASK_REGEX, --task_regex TASK_REGEX
                        The regex to filter specific task_ids to backfill
                        (optional)
  -s START_DATE, --start_date START_DATE
                        Override start_date YYYY-MM-DD
  -e END_DATE, --end_date END_DATE
                        Override end_date YYYY-MM-DD
  -m, --mark_success    Mark jobs as succeeded without running them
  -l, --local           Run the task using the LocalExecutor
  -x, --donot_pickle    Do not attempt to pickle the DAG object to send over
                        to the workers, just tell the workers to run their
                        version of the code.
  -y, --yes             Do not prompt to confirm reset. Use with care!
  -i, --ignore_dependencies
                        Skip upstream tasks, run only the tasks matching the
                        regexp. Only works in conjunction with task_regex
  -I, --ignore_first_depends_on_past
                        Ignores depends_on_past dependencies for the first set
                        of tasks only (subsequent executions in the backfill
                        DO respect depends_on_past).
  -sd SUBDIR, --subdir SUBDIR
                        File location or directory from which to look for the
                        dag. Defaults to '[AIRFLOW_HOME]/dags' where
                        [AIRFLOW_HOME] is the value you set for 'AIRFLOW_HOME'
                        config you set in 'airflow.cfg'
  --pool POOL           Resource pool to use
  --delay_on_limit DELAY_ON_LIMIT
                        Amount of time in seconds to wait when the limit on
                        maximum active dag runs (max_active_runs) has been
                        reached before trying to execute a dag run again.
  -dr, --dry_run        Perform a dry run for each task. Only renders Template
                        Fields for each task, nothing else
  -v, --verbose         Make logging output more verbose
  -c CONF, --conf CONF  JSON string that gets pickled into the DagRun's conf
                        attribute
  --reset_dagruns       if set, the backfill will delete existing backfill-
                        related DAG runs and start anew with fresh, running
                        DAG runs
  --rerun_failed_tasks  if set, the backfill will auto-rerun all the failed
                        tasks for the backfill date range instead of throwing
                        exceptions
  -B, --run_backwards   if set, the backfill will run tasks from the most
                        recent day first. if there are tasks that
                        depend_on_past this option will throw an exception
```
### donot_pickle
当执行`airflow backfill senselink-oss-download -s 2020-12-16 -e 2020-12-27`报错如下:
```console
ERROR - Executor reports task instance <TaskInstance: senselink_oss_download.senselink_ods_mysql_ingestion 2020-12-18 05:00:00+00:00 [queued]> finished (failed) although the task says its queued. Was the task killed externally?
```
backfill 的任务直接变成`up_for_retry`状态，而其他的任务都是`scheduled`，但是一直不执行，查看`task_instance`表，`hostname`和`job_id`字段都为空

* [Apache Airflow: Executor reports task instance finished (failed) although the task says its queued](https://stackoverflow.com/questions/56119107/apache-airflow-executor-reports-task-instance-finished-failed-although-the-ta)

```shell
# Pickle 是一个原生的 Python 序列化对象，表示某个版本的 DAG(可以理解为某个版本的 DAG 快照)，当执行 BackfillJob 时，
# 实际运行的就是某个特定的序列化的 Pickle 对象
# 指定 -x, --donot_pickle，这样就不会把 airflow 序列化的 pickle 发送给 worker，而是使用 worker 节点自身版本的 DAG。
# 当你 Backfill 一个不存在的 DagRun，就会出现问题，假设 2020-10-01 号的 DagRun 不存在，也就是说没跑过，你执行
# Backfill 2020-10-01 就会出现上面的现象，因为 Pickle 对象不存在
$ airflow backfill senselink-oss-download -s 2020-12-16 -e 2020-12-27 --donot_pickle
```

> [dagpickle](https://airflow.apache.org/docs/apache-airflow/stable/_api/airflow/models/dagpickle/index.html): Dags can originate from different places (user repos, master repo, ...) and also get executed in different places (different executors). This object represents a version of a DAG and becomes a source of truth for a BackfillJob execution. A pickle is a native python serialized object, and in this case gets stored in the database for the duration of the job. The executors pick up the DagPickle id and read the dag definition from the database.

## clear
```shell
$ airflow clear --help
usage: airflow clear [-h] [-t TASK_REGEX] [-s START_DATE] [-e END_DATE]
                     [-sd SUBDIR] [-u] [-d] [-c] [-f] [-r] [-x] [-xp] [-dx]
                     dag_id

positional arguments:
  dag_id                The id of the dag

optional arguments:
  -h, --help            show this help message and exit
  -t TASK_REGEX, --task_regex TASK_REGEX
                        The regex to filter specific task_ids to backfill
                        (optional)
  -s START_DATE, --start_date START_DATE
                        Override start_date YYYY-MM-DD
  -e END_DATE, --end_date END_DATE
                        Override end_date YYYY-MM-DD
  -sd SUBDIR, --subdir SUBDIR
                        File location or directory from which to look for the
                        dag. Defaults to '[AIRFLOW_HOME]/dags' where
                        [AIRFLOW_HOME] is the value you set for 'AIRFLOW_HOME'
                        config you set in 'airflow.cfg'
  -u, --upstream        Include upstream tasks
  -d, --downstream      Include downstream tasks
  -c, --no_confirm      Do not request confirmation
  -f, --only_failed     Only failed jobs
  -r, --only_running    Only running jobs
  -x, --exclude_subdags
                        Exclude subdags
  -xp, --exclude_parentdag
                        Exclude ParentDAGS if the task cleared is a part of a
                        SubDAG
  -dx, --dag_regex      Search dag_id as regex instead of exact string
```