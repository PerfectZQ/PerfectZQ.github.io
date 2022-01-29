---
layout: post
title: PrestoSQL
tag: Presto SQL
---

## Presto Explode
presto 没有 explode 可以使用 `unset`
```sql
WITH example(data) as 
(
    VALUES
    (json '{"result":[{"name":"Jarret","score":"90"},{"name":"Blanche","score":"95"}]}'),
    (json '{"result":[{"name":"Blanche","score":"76"},{"name":"Jarret","score":"88"}]}')
)
SELECT 
       n.name as "Student Name", 
       avg(n.score) as "Average Score"
FROM example
CROSS JOIN
    UNNEST ( 
        CAST (JSON_EXTRACT(data, '$.result')
        as ARRAY(ROW(name VARCHAR, score INTEGER )))
    ) as n
GROUP BY n.name;
```